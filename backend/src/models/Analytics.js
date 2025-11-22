const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true }, // 建立索引，方便查询
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 可选
  timestamp: { type: Date, default: Date.now },
  url: String,
  metadata: { type: mongoose.Schema.Types.Mixed } // 存储额外的 JSON 数据
});

module.exports = mongoose.model('Analytics', analyticsSchema);
