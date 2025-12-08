/**
 * 用户数据模型
 * 用于存储用户基本信息和认证数据
 */
const mongoose = require('mongoose');

/**
 * 用户数据模式
 * @typedef {Object} UserSchema
 * @property {string} phone - 用户手机号（必填，唯一）
 * @property {string} nickname - 用户昵称（默认'新用户'）
 * @property {string} avatar - 用户头像URL（默认空字符串）
 * @property {string} password - 用户密码（可选，部分老用户可能没有设置密码）
 * @property {Date} lastLoginAt - 用户最后登录时间
 * @property {Date} createdAt - 记录创建时间（由timestamps自动生成）
 * @property {Date} updatedAt - 记录更新时间（由timestamps自动生成）
 */
const userSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  nickname: { 
    type: String, 
    default: '新用户' 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  password: { 
    type: String 
  }, // 密码字段，可选，因为可能存在没有设置密码的老用户
  lastLoginAt: { 
    type: Date 
  }
}, { timestamps: true });

/**
 * 用户数据模型
 */
module.exports = mongoose.model('User', userSchema);
