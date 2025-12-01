const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const router = express.Router();

// 数据库连接
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 模拟身份验证中间件
const authMiddleware = (req, res, next) => {
  // 在实际环境中，这里应该验证JWT token
  req.user = req.headers.authorization ? { userId: 'test-user-id' } : null;
  next();
};

// 帖子相关端点

// 获取帖子列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, userId } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { status: 'published' };
    if (tag) query.tags = tag;
    if (userId) query.author = mongoose.Types.ObjectId(userId);
    
    const posts = await mongoose.model('Post').find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'nickname avatar');
    
    const total = await mongoose.model('Post').countDocuments(query);
    
    res.json({
      success: true,
      data: posts,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 发布帖子
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const { title, content, images = [], tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    }
    
    const newPost = await mongoose.model('Post').create({
      title,
      content,
      images,
      tags,
      author: req.user.userId,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({ success: true, data: newPost });
  } catch (error) {
    console.error('发布帖子失败:', error);
    res.status(500).json({ success: false, message: '发布失败' });
  }
});

// 获取帖子详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: '无效的帖子ID' });
    }
    
    const post = await mongoose.model('Post').findById(id)
      .populate('author', 'nickname avatar');
    
    if (!post || post.status !== 'published') {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }
    
    // 更新浏览量
    await mongoose.model('Post').findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    const postObject = post.toObject();
    postObject.isLiked = userId ? postObject.likesUsers?.includes(userId) : false;
    delete postObject.likesUsers;
    
    res.json({ success: true, data: postObject });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 点赞帖子
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await mongoose.model('Post').updateOne(
      { _id: id, likesUsers: { $ne: userId } },
      {
        $addToSet: { likesUsers: userId },
        $inc: { likes: 1 }
      }
    );
    
    res.json({ success: true, message: '点赞成功' });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ success: false, message: '点赞失败' });
  }
});

// 取消点赞
router.post('/:id/unlike', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await mongoose.model('Post').updateOne(
      { _id: id, likesUsers: userId },
      {
        $pull: { likesUsers: userId },
        $inc: { likes: -1 }
      }
    );
    
    res.json({ success: true, message: '取消点赞成功' });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({ success: false, message: '取消点赞失败' });
  }
});

// AI生成标签
router.post('/ai-label', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: '内容不能为空' });
    }
    
    // 这里应该调用AI服务，但为了简化，返回模拟数据
    res.json({ 
      success: true, 
      data: { 
        tags: ['科技', '生活', 'AI'],
        confidence: 0.9 
      }
    });
  } catch (error) {
    console.error('AI标签生成失败:', error);
    res.json({ 
      success: true, 
      data: { 
        tags: ['日常', '生活'],
        confidence: 0.5 
      }
    });
  }
});

// 挂载路由
app.use('/api/posts', router);

// 导出serverless函数
module.exports.handler = serverless(app);