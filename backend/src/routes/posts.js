const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ 必须引入 mongoose 才能做类型转换
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');

// --- 1. AI 配置 (保留你的功能) ---
const client = new OpenAI({
  apiKey: process.env.VOLC_API_KEY || '1b59816c-cc5f-4878-9062-16a15ec048f9',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});
const MODEL_ID = process.env.VOLC_MODEL_ID || 'doubao-seed-1-6-251015';

// --- 2. 上传配置 ---
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

// --- 3. 获取列表 ---
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'nickname avatar'); // 关联作者信息

    const total = await Post.countDocuments({ status: 'published' });
    const hasMore = total > skip + limit;

    res.json({ list: posts, total, hasMore, page });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ message: '获取列表失败: ' + error.message });
  }
});

// --- 4. 发布帖子 ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, images, tags } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // ✅ 关键点：直接用 req.user.userId，不需要 new ObjectId()
    // 因为换了新的 auth.js 后，userId 已经是合法的格式了，Mongoose 会自动处理
    const newPost = new Post({
      title: title || '',
      content: content,
      images: images || [],
      tags: tags || [],
      author: req.user.userId
    });

    const savedPost = await newPost.save();

    // 尝试填充作者信息
    await savedPost.populate('author', 'nickname avatar');

    res.status(201).json(savedPost);

  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ message: '发布失败: ' + error.message });
  }
});


// --- 5. AI 生成标签 (你的 AI 功能回来了) ---
router.post('/ai-label', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '内容不能为空' });

    console.log('🤖 正在请求 AI 分析...');

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是一个资深的新闻编辑。请提取3-5个最相关的标签。输出纯JSON数组格式，例如：[\"生活\", \"美食\"]。不要包含markdown代码块。"
        },
        { role: "user", content: content }
      ],
      model: MODEL_ID,
    });

    const aiResult = completion.choices[0].message.content;
    console.log('🤖 AI 返回:', aiResult);

    // 清洗数据
    let tags = [];
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      tags = JSON.parse(cleanJson);
    } catch (e) {
      console.error('JSON 解析失败，使用默认标签');
      tags = ['AI推荐', '热点'];
    }

    res.json({ tags, confidence: 0.9 });

  } catch (error) {
    console.error('AI Service Error:', error);
    // 就算 AI 挂了，也不要让前端崩，返回兜底数据
    res.json({ tags: ['日常', '生活'], confidence: 0.5 });
  }
});

// --- 6. 图片上传 ---
router.post('/upload', authMiddleware, upload.array('images', 9), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ message: '无文件' });
    const fileUrls = files.map(file => `http://localhost:3000/uploads/${file.filename}`);
    res.json({ urls: fileUrls });
  } catch (error) {
    res.status(500).json({ message: '上传失败' });
  }
});

module.exports = router;
