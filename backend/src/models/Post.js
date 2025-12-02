const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, default: '' }, // 必须有这一行
  content: { type: String, required: true },
  images: [{ type: String }],
  tags: [{ type: String }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likesUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 点赞用户列表
  comments: [commentSchema], // 评论列表
  commentsCount: { type: Number, default: 0 }, // 评论数量
  status: { type: String, default: 'published' },
  createdAt: { type: Date, default: Date.now },
  editAt: { type: Date } // 编辑时间字段
});

module.exports = mongoose.model('Post', postSchema);