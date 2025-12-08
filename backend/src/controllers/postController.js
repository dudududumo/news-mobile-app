/**
 * 文章控制器
 * 处理文章的创建、获取、图片上传等功能
 */
const Post = require('../models/Post');
// 引入 User 是为了确保 Schema 注册，防止 populate 报错
const User = require('../models/User');
const fs = require('fs-extra');
const path = require('path');
// 引入 AI 服务
const aiService = require('../services/aiService');

/**
 * 图片上传处理
 * @async
 * @param {Object} req - Express请求对象
 * @param {Array<Object>} req.files - 上传的文件列表
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.uploadImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: '没有上传文件' });
  }
  // 返回文件访问路径
  const urls = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ urls });
};

/**
 * 发布/保存文章（模拟实现）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createPost = async (req, res) => {
  setTimeout(() => {
    res.json({ message: '模拟发布成功', post: { _id: 'new_mock' } });
  }, 500);
};

/**
 * AI 标签生成（真实接入火山引擎）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.content - 文章内容
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.aiLabel = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '内容不能为空' });
  }

  try {
    // 调用 AI 服务
    const tags = await aiService.generateTags(content);

    res.json({
      tags: tags,
      // 火山引擎普通调用不直接返回置信度分数，这里我们可以写死一个高分，
      // 或者如果想做更复杂的逻辑，需要调用内容审核接口等。
      confidence: 0.95
    });
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({ message: 'AI 识别服务暂时不可用' });
  }
};

/**
 * 获取文章列表（模拟实现）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.query - 查询参数
 * @param {number} [req.query.page=1] - 页码
 * @param {number} [req.query.limit=10] - 每页条数
 * @param {string} [req.query.sort='createdAt'] - 排序字段
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getPosts = async (req, res) => {
  try {
    // 获取查询参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 获取排序参数，默认为按创建时间倒序
    let sortField = req.query.sort || 'createdAt';
    let sortOrder = 1;

    // 处理排序方向，支持以-开头表示降序
    if (sortField.startsWith('-')) {
      sortField = sortField.substring(1);
      sortOrder = -1;
    }

    // 创建排序对象
    const sortObj = { [sortField]: sortOrder };

    // 生成模拟数据
    const mockPosts = Array.from({ length: 50 }).map((_, i) => ({
      _id: `mock_${Date.now()}_${i}`, // 使用时间戳+索引作为ID
      content: `这是第 ${i + 1} 条模拟动态内容。分享生活中的美好瞬间。`,
      images: i % 3 === 0 ? [`https://picsum.photos/seed/${i}1/400/300`] :
        i % 3 === 1 ? [`https://picsum.photos/seed/${i}2/300/300`, `https://picsum.photos/seed/${i}3/301/301`] : [],
      author: {
        nickname: `User_${i}`,
        avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`
      },
      tags: ['测试', '模拟数据'],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(), // 每条差1小时
      likes: 10 + i
    }));

    // 应用排序
    let sortedPosts = [...mockPosts];
    sortedPosts.sort((a, b) => {
      if (sortField === 'createdAt') {
        return sortOrder * (new Date(a[sortField]) - new Date(b[sortField]));
      } else if (sortField === 'likes') {
        return sortOrder * (a[sortField] - b[sortField]);
      }
      return 0;
    });

    // 应用分页
    const paginatedPosts = sortedPosts.slice(skip, skip + limit);
    const total = mockPosts.length;
    const hasMore = total > skip + limit;

    // 模拟网络延迟
    setTimeout(() => {
      res.json({
        list: paginatedPosts,
        hasMore,
        total
      });
    }, 500);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
