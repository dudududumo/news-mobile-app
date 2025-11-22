const mongoose = require('mongoose');

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
  status: { type: String, default: 'published' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
