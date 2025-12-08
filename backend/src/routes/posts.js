/**
 * 文章路由
 * 处理文章的创建、获取、更新、删除、点赞、评论等功能
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const OpenAI = require('openai');
// 导入COS模块
const COS = require('cos-nodejs-sdk-v5');

// --- 1. AI 配置 ---
const client = new OpenAI({
  apiKey: process.env.VOLC_API_KEY || '1b59816c-cc5f-4878-9062-16a15ec048f9',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});
const MODEL_ID = process.env.VOLC_MODEL_ID || 'doubao-seed-1-6-251015';

// --- 2. COS 配置 ---
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});
const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

// --- 3. multer 临时存储 ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- 4. 获取列表 ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user?.userId;

    const posts = await Post.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'nickname avatar');

    const total = await Post.countDocuments({ status: 'published' });
    const hasMore = total > skip + limit;

    const processedPosts = posts.map(post => {
      const postObject = post.toObject();
      postObject.isLiked = userId ? postObject.likesUsers?.map(uid => uid.toString()).includes(userId) : false;
      postObject.likes = postObject.likes || 0;
      postObject.commentsCount = postObject.commentsCount || 0;
      delete postObject.likesUsers;
      return postObject;
    });

    res.json({ list: processedPosts, total, hasMore, page });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ message: '获取列表失败:' + error.message });
  }
});

// --- 5. 发布帖子 ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, images, tags } = req.body;
    if (!req.user?.userId) return res.status(401).json({ message: '未授权' });

    // 先创建帖子，不等待AI标签生成
    const newPost = new Post({
      title: title || '',
      content,
      images: images || [],
      tags: ['生成中'], // 临时标签
      author: req.user.userId,
      likes: 0,
      commentsCount: 0
    });

    const savedPost = await newPost.save();
    await savedPost.populate('author', 'nickname avatar');

    // 异步生成AI标签，不阻塞响应
    setImmediate(async () => {
      let finalTags = ['日常', '生活'];
      // 准备用于生成标签的内容
      const fullText = `${title || ''}\n${content.replace(/<[^>]+>/g, '')}`.trim();
      if (fullText.length > 10) {
        try {
          // 调用AI标签生成功能
          const completion = await client.chat.completions.create({
            messages: [
              { role: "system", content: "你是一个资深的资讯编辑。请提取3-5个最相关的标签。输出纯JSON数组格式，例如:[\"生活\",\"美食\"]。" },
              { role: "user", content: fullText }
            ],
            model: MODEL_ID,
          });

          try {
            const aiResult = completion.choices[0].message.content;
            const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
            finalTags = JSON.parse(cleanJson);
            console.log('AI生成的标签:', finalTags);
          } catch (parseError) {
            console.error('AI JSON解析失败，使用默认标签:', parseError);
          }
        } catch (aiError) {
          console.error('AI标签生成失败，使用默认标签:', aiError);
        }
      }

      // 更新帖子的标签
      await Post.findByIdAndUpdate(savedPost._id, { tags: finalTags });
    });

    res.status(201).json(savedPost);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ message: '发布失败:' + error.message });
  }
});

// --- 6. AI生成标签 ---


// --- 7. 图片上传到 COS ---
router.post('/upload', authMiddleware, upload.array('images', 9), async (req, res) => {
  try {
    const files = req.files;
    if (!files || !files.length) return res.status(400).json({ message: '无文件' });

    const urls = [];

    for (const file of files) {
      const ext = path.extname(file.originalname);
      const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
      fs.writeFileSync(tempFilePath, file.buffer);

      if (!fs.existsSync(tempFilePath)) {
        console.error('临时文件不存在', tempFilePath);
        return res.status(500).json({ message: '临时文件不存在' });
      }

      const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

      await new Promise((resolve, reject) => {
        cos.sliceUploadFile({
          Bucket: BUCKET,
          Region: REGION,
          Key: key,
          FilePath: tempFilePath,
          ContentType: file.mimetype
        }, (err) => {
          fs.unlinkSync(tempFilePath);
          if (err) return reject(err);
          urls.push(`https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`);
          resolve();
        });
      });
    }

    res.json({ urls });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ message: '上传失败', error });
  }
});

// --- 8. 获取文章详情 ---
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: '无效的文章ID' });

    const updatedPost = await Post.findOneAndUpdate(
      { _id: id, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'nickname avatar');

    if (!updatedPost) return res.status(404).json({ message: '文章不存在或未发布' });

    const postObject = updatedPost.toObject();
    postObject.isLiked = userId ? postObject.likesUsers?.map(uid => uid.toString()).includes(userId) : false;
    postObject.likes = postObject.likes || 0;
    postObject.commentsCount = postObject.commentsCount || 0;
    delete postObject.likesUsers;

    if (!postObject.author) postObject.author = { nickname: '匿名用户', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=0' };

    if (postObject.tags?.length) {
      const relatedPosts = await Post.find({
        _id: { $ne: id },
        status: 'published',
        tags: { $in: postObject.tags }
      }).sort({ views: -1, createdAt: -1 }).limit(3).select('title tags');
      postObject.relatedPosts = relatedPosts;
    }

    res.json(postObject);
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({ message: '获取文章详情失败:' + error.message });
  }
});

// --- 9. 点赞 ---
router.post('/:id/like', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: '请登录后点赞' });

  try {
    const { id } = req.params;
    const updateResult = await Post.updateOne(
      { _id: id, likesUsers: { $ne: userId } },
      { $addToSet: { likesUsers: userId }, $inc: { likes: 1 } }
    );
    if (updateResult.matchedCount === 0) {
      const postExists = await Post.findById(id).select('_id');
      if (!postExists) return res.status(404).json({ message: '文章不存在' });
    }
    res.json({ message: '点赞成功' });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ message: '点赞失败' });
  }
});

// --- 10. 取消点赞 ---
router.post('/:id/unlike', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: '请登录后取消点赞' });

  try {
    const { id } = req.params;
    const result = await Post.updateOne(
      { _id: id, likesUsers: userId },
      { $pull: { likesUsers: userId }, $inc: { likes: -1 } }
    );
    if (result.matchedCount === 0) {
      const postExists = await Post.findById(id).select('_id');
      if (!postExists) return res.status(404).json({ message: '文章不存在' });
    }
    res.json({ message: '取消点赞成功' });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ message: '取消点赞失败' });
  }
});

// --- 11. 添加评论 ---
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    if (!content?.trim()) return res.status(400).json({ message: '评论内容不能为空' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    const comment = { user: userId, content: content.trim(), createdAt: new Date() };
    post.comments = post.comments || [];
    post.comments.push(comment);
    post.commentsCount = post.comments.length;

    await post.save();

    const user = await User.findById(userId, 'nickname avatar');
    const savedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: {
        _id: savedComment._id,
        content: savedComment.content,
        createdAt: savedComment.createdAt,
        user: { _id: user._id, nickname: user.nickname, avatar: user.avatar }
      },
      commentsCount: post.commentsCount
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

// --- 12. 获取评论列表 ---
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id, 'comments');
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    if (!post.comments?.length) return res.json({ success: true, comments: [], total: 0 });

    const userIds = post.comments.map(c => c.user);
    const users = await User.find({ _id: { $in: userIds } }, 'nickname avatar');
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.toObject();
      return map;
    }, {});

    const comments = post.comments.map(comment => {
      const commentObject = comment.toObject();
      const user = userMap[commentObject.user.toString()] || { nickname: '匿名用户', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=0' };
      return { ...commentObject, user: { _id: user._id, nickname: user.nickname, avatar: user.avatar } };
    }).sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, comments, total: comments.length });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

// --- 13. 删除帖子 ---  
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: '请登录后删除帖子' });

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: '无效的文章ID' });

    // 检查帖子是否存在且属于当前用户
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    // 确保只能删除自己的帖子
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: '无权删除此帖子' });
    }

    // 删除帖子
    await Post.findByIdAndDelete(id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

// --- 14. 更新帖子 ---  
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: '请登录后编辑帖子' });

  try {
    const { id } = req.params;
    const { title, content, images, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: '无效的文章ID' });

    // 检查帖子是否存在且属于当前用户
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    // 确保只能编辑自己的帖子
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: '无权编辑此帖子' });
    }

    // 先更新帖子内容，不等待AI标签生成
    // 更新帖子内容
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title: title || '',
        content,
        images: images || [],
        tags: ['生成中'], // 临时标签
        editAt: new Date()
      },
      { new: true }
    ).populate('author', 'nickname avatar');

    // 异步生成AI标签，不阻塞响应
    setImmediate(async () => {
      let finalTags = ['日常', '生活'];
      // 准备用于生成标签的内容
      const fullText = `${title || ''}\n${content.replace(/<[^>]+>/g, '')}`.trim();
      if (fullText.length > 10) {
        try {
          // 调用AI标签生成功能
          const completion = await client.chat.completions.create({
            messages: [
              { role: "system", content: "你是一个资深的资讯编辑。请提取3-5个最相关的标签。输出纯JSON数组格式，例如:[\"生活\",\"美食\"]。" },
              { role: "user", content: fullText }
            ],
            model: MODEL_ID,
          });

          try {
            const aiResult = completion.choices[0].message.content;
            const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
            finalTags = JSON.parse(cleanJson);
            console.log('AI生成的标签:', finalTags);
          } catch (parseError) {
            console.error('AI JSON解析失败，使用默认标签:', parseError);
          }
        } catch (aiError) {
          console.error('AI标签生成失败，使用默认标签:', aiError);
        }
      }

      // 更新帖子的标签
      await Post.findByIdAndUpdate(id, { tags: finalTags });
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('更新帖子失败:', error);
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

// --- 15. 删除评论 ---  
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: '请登录后删除评论' });

  try {
    const { id, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: '无效的文章ID' });
    if (!mongoose.Types.ObjectId.isValid(commentId)) return res.status(400).json({ message: '无效的评论ID' });

    // 检查帖子是否存在
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    // 找到评论
    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) return res.status(404).json({ message: '评论不存在' });

    // 确保只能删除自己的评论
    if (post.comments[commentIndex].user.toString() !== userId) {
      return res.status(403).json({ message: '无权删除此评论' });
    }

    // 删除评论
    post.comments.splice(commentIndex, 1);
    post.commentsCount = post.comments.length;

    await post.save();
    res.json({ message: '评论删除成功', commentsCount: post.commentsCount });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

// --- 16. 保存草稿 ---  
router.post('/draft', authMiddleware, async (req, res) => {
  try {
    console.log('保存草稿请求参数:', req.body);
    console.log('用户信息:', req.user);

    const { title, content, images, tags, originalPostId } = req.body;
    const userId = req.user?.userId;

    // 确保userId存在
    if (!userId) {
      console.error('保存草稿失败: 未找到用户ID');
      return res.status(401).json({ message: '未授权' });
    }

    if (originalPostId) {
      // 更新现有草稿
      const draft = await Post.findByIdAndUpdate(
        originalPostId,
        {
          title: title || '',
          content: content || '',
          images: images || [],
          tags: tags || [],
          status: 'draft',
          editAt: new Date()
        },
        { new: true }
      );

      if (!draft) {
        return res.status(404).json({ message: '草稿不存在' });
      }

      res.json(draft);
    } else {
      // 创建新草稿
      const newDraft = new Post({
        title: title || '',
        content: content || '',
        images: images || [],
        tags: tags || [],
        author: userId,
        status: 'draft',
        likes: 0,
        commentsCount: 0
      });

      const savedDraft = await newDraft.save();
      await savedDraft.populate('author', 'nickname avatar');
      res.status(201).json(savedDraft);
    }
  } catch (error) {
    console.error('保存草稿失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ message: '保存草稿失败:' + error.message });
  }
});

// --- 17. 获取草稿列表 ---  
router.get('/draft', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: '未授权' });

    const drafts = await Post.find({ author: userId, status: 'draft' })
      .sort({ editAt: -1 })
      .populate('author', 'nickname avatar');

    res.json(drafts);
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    res.status(500).json({ message: '获取草稿列表失败:' + error.message });
  }
});

module.exports = router;
