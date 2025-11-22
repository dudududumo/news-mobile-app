const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  nickname: { type: String, default: '新用户' },
  avatar: { type: String, default: '' },
  password: { type: String }, // 密码字段，可选，因为可能存在没有设置密码的老用户
  lastLoginAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
