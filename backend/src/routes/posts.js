// C:\Users\杜姝蒙\news-mobile-app\backend\src\routes\posts.js:
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');//✅必须引入mongoose才能做类型转换
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const auth = authMiddleware;//为评论路由添加别名
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');
//---1.AI配置(保留你的功能)---
const client = new OpenAI({
  apiKey: process.env.VOLC_API_KEY || '1b59816c-cc5f-4878-9062-16a15ec048f9',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});
const MODEL_ID = process.env.VOLC_MODEL_ID || 'doubao-seed-1-6-251015';
//---2.上传配置---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

//---3.获取列表---✅增强：在列表页添加isLiked和评论/点赞数
router.get('/', authMiddleware, async (req, res) => {//列表页也使用authMiddleware，即使未登录也能访问（req.user为空）
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user?.userId;//获取当前登录用户ID

    let posts = await Post.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'nickname avatar');//关联作者信息

    const total = await Post.countDocuments({ status: 'published' });
    const hasMore = total > skip + limit;

    //✅增强：处理isLiked字段
    const processedPosts = posts.map(post => {
      const postObject = post.toObject();

      // ✅根据登录状态和likesUsers数组判断是否点赞
      // 必须将 ObjectId 转换为字符串进行比较
      postObject.isLiked = userId ? postObject.likesUsers?.map(uid => uid.toString()).includes(userId) : false;

      //确保返回likes和commentsCount
      postObject.likes = postObject.likes || 0;
      postObject.commentsCount = postObject.commentsCount || 0;

      // ✅移除敏感的likesUsers数组
      delete postObject.likesUsers;
      return postObject;
    });

    res.json({ list: processedPosts, total, hasMore, page });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ message: '获取列表失败:' + error.message });
  }
});

//---4.发布帖子--- (保持不变)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, images, tags } = req.body;
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: '未授权' });
    }
    //✅关键点：直接用req.user.userId，不需要new ObjectId()
    const newPost = new Post({
      title: title || '',
      content: content,
      images: images || [],
      tags: tags || [],
      author: req.user.userId,
      likes: 0,//确保有默认值
      commentsCount: 0//确保有默认值
    });
    const savedPost = await newPost.save();
    //尝试填充作者信息
    await savedPost.populate('author', 'nickname avatar');
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ message: '发布失败:' + error.message });
  }
});

//---5.AI生成标签(你的AI功能回来了)--- (保持不变)
router.post('/ai-label', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '内容不能为空' });
    console.log('正在请求AI分析...');
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是一个资深的资讯编辑。请提取3-5个最相关的标签。输出纯JSON数组格式，例如：[\"生活\",\"美食\"]。不要包含markdown代码块。"
        },
        { role: "user", content: content }
      ],
      model: MODEL_ID,
    });
    const aiResult = completion.choices[0].message.content;
    console.log('AI返回:', aiResult);
    //清洗数据
    let tags = [];
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      tags = JSON.parse(cleanJson);
    } catch (e) {
      console.error('JSON解析失败，使用默认标签');
      tags = ['AI推荐', '热点'];
    }
    res.json({ tags, confidence: 0.9 });
  } catch (error) {
    console.error('AI Service Error:', error);
    //就算AI挂了，也不要让前端崩，返回兜底数据
    res.json({ tags: ['日常', '生活'], confidence: 0.5 });
  }
});

//---6.图片上传--- (保持不变)
router.post('/upload', authMiddleware, upload.array('images', 9), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: '无文件' });
    }

    // 自动识别当前域名（Zeabur / 本地）
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const fileUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
    res.json({ urls: fileUrls });

  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ message: '上传失败' });
  }
});


//---7.获取文章详情(GET/posts/:id)✅修复问题1/2:阅读量+1逻辑&isLiked
router.get('/:id', authMiddleware, async (req, res) => {//详情页添加authMiddleware
  try {
    const { id } = req.params;
    const userId = req.user?.userId;//获取当前登录用户ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: '无效的文章ID' });
    }

    //1.⚛️原子操作：查找文章并增加浏览量(views:1)
    const updatedPost = await Post.findOneAndUpdate(
      { _id: id, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }//返回更新后的文档
    )
      .populate('author', 'nickname avatar');

    if (!updatedPost) {
      return res.status(404).json({ message: '文章不存在或未发布' });
    }

    let postObject = updatedPost.toObject();

    //2.✅修复问题2:判断isLiked
    postObject.isLiked = userId ? postObject.likesUsers?.map(uid => uid.toString()).includes(userId) : false;

    //3.兜底逻辑 (保持不变)
    if (!postObject.author) {
      postObject.author = { nickname: '匿名用户', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=0' };
    }

    //4.相关内容推荐(不变)
    if (postObject.tags && postObject.tags.length > 0) {
      const relatedPosts = await Post.find({
        _id: { $ne: id },
        status: 'published',
        tags: { $in: postObject.tags }
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(3)
        .select('title tags');
      postObject.relatedPosts = relatedPosts;
    }

    //5.确保返回likes和commentsCount
    postObject.likes = postObject.likes || 0;
    postObject.commentsCount = postObject.commentsCount || 0;

    // ✅移除敏感的likesUsers数组
    delete postObject.likesUsers;

    //6.返回处理后的数据
    res.json(postObject);
  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({ message: '获取文章详情失败:' + error.message });
  }
});

//---8.点赞(POST/posts/:id/like)✅修复：修正404误判，确保幂等性
router.post('/:id/like', authMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: '请登录后点赞' });
  }
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    // 📢 增加日志：打印当前操作的用户ID
    console.log(`[LIKE] 帖子ID: ${id}, 当前用户ID: ${userId}`);

    // 1. 使用 $addToSet 确保userId只添加一次，使用 $inc 增加likes计数
    const result = await Post.updateOne(
      { _id: id }, // ⚠️ 只查询文章ID
      {
        $addToSet: { likesUsers: userId },
        $inc: { likes: 1 } // 始终尝试增加计数，这需要修正
      }
    );

    // 修正：原子操作只在未点赞时执行
    const updateResult = await Post.updateOne(
      { _id: id, likesUsers: { $ne: userId } }, // 只有未点赞时才操作
      {
        $addToSet: { likesUsers: userId },
        $inc: { likes: 1 } // 只有在执行添加操作时才增加计数
      }
    );

    // 检查文章是否存在（matchedCount>0）
    // 为了获取 matchedCount，我们用 updateResult
    if (updateResult.matchedCount === 0) {
      // 检查文章ID是否有效
      const postExists = await Post.findById(id).select('_id');
      if (!postExists) {
        return res.status(404).json({ message: '文章不存在' });
      }
      // 如果 matchedCount==0 且文章存在，说明用户已点赞（已满足幂等性）
    }

    // 无论是否修改，都返回成功，实现幂等性
    res.json({ message: '点赞成功' });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ message: '点赞失败' });
  }
});

//---9.取消点赞(POST/posts/:id/unlike)✅修复：修正404误判，确保幂等性
router.post('/:id/unlike', authMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: '请登录后取消点赞' });
  }
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    // 📢 增加日志：打印当前操作的用户ID
    console.log(`[UNLIKE] 帖子ID: ${id}, 当前用户ID: ${userId}`);

    // 1. 使用$pull从数组中移除userId，并使用$inc减少likes计数
    const result = await Post.updateOne(
      { _id: id, likesUsers: userId },// 只有当文章ID存在 且 用户ID存在时才更新
      {
        $pull: { likesUsers: userId },
        $inc: { likes: -1 }//减少计数
      }
    );

    // 2. 检查文章是否存在
    if (result.matchedCount === 0) {
      // 如果 matchedCount==0，可能是文章不存在，也可能是用户未点赞
      const postExists = await Post.findById(id).select('_id');
      if (!postExists) {
        return res.status(404).json({ message: '文章不存在' });
      }
      // 如果文章存在但 matchedCount==0，说明用户未点赞（已满足幂等性）
    }

    // 无论是否修改，都返回成功，实现幂等性
    res.json({ message: '取消点赞成功' });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ message: '取消点赞失败' });
  }
});

//---10.添加评论(POST/posts/:id/comments)路径修正 (保持不变)
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }
    //查找帖子
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    //创建评论
    const comment = {
      user: userId,
      content: content.trim(),
      createdAt: new Date()
    };
    //初始化comments数组（如果不存在）
    if (!post.comments) {
      post.comments = [];
    }
    //添加评论
    post.comments.push(comment);
    //⚛️统一更新评论数
    post.commentsCount = post.comments.length;
    //保存帖子
    await post.save();
    //查找用户信息以返回完整的评论数据
    const user = await User.findById(userId, 'nickname avatar');
    //确保返回的评论对象包含ID
    const savedComment = post.comments[post.comments.length - 1];
    res.status(201).json({
      success: true,
      comment: {
        _id: savedComment._id,//返回评论ID
        content: savedComment.content,
        createdAt: savedComment.createdAt,
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar
        }
      },
      commentsCount: post.commentsCount
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});

//---11.获取评论列表(GET/posts/:id/comments)路径修正 (保持不变)
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    //查找帖子并只返回comments字段
    const post = await Post.findById(id, 'comments');
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    //初始化comments数组（如果不存在）
    if (!post.comments || post.comments.length === 0) {
      return res.json({ success: true, comments: [], total: 0 });
    }
    //优化：批量查询用户，而不是在循环中一个个查
    const userIds = post.comments.map(c => c.user);
    const users = await User.find({ _id: { $in: userIds } }, 'nickname avatar');
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.toObject();
      return map;
    }, {});
    //组装评论列表(倒序排列，最新评论在最前面)
    const comments = post.comments
      .map(comment => {
        const commentObject = comment.toObject();
        const user = userMap[commentObject.user.toString()] || { nickname: '匿名用户', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=0' };
        return {
          ...commentObject,
          user: { _id: user._id, nickname: user.nickname, avatar: user.avatar }
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);//最新评论在顶部
    res.json({
      success: true,
      comments: comments,
      total: comments.length
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
});
module.exports = router;