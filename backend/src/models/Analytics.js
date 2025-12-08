/**
 * 分析数据模型
 * 用于记录用户行为和系统事件
 */
const mongoose = require('mongoose');

/**
 * 分析数据模式
 * @typedef {Object} AnalyticsSchema
 * @property {string} event - 事件名称（必填，已建立索引）
 * @property {ObjectId} user_id - 用户ID（可选，关联User模型）
 * @property {Date} timestamp - 事件发生时间（默认当前时间）
 * @property {string} url - 事件发生的URL（可选）
 * @property {Object} metadata - 存储额外的JSON数据（可选）
 */
const analyticsSchema = new mongoose.Schema({
  event: { 
    type: String, 
    required: true, 
    index: true 
  }, // 建立索引，方便查询
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // 可选
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  url: String,
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  } // 存储额外的 JSON 数据
});

/**
 * 分析数据模型
 */
module.exports = mongoose.model('Analytics', analyticsSchema);
