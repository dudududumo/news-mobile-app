const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// 发送验证码
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入有效的手机号码' });
    }
    
    // 检查用户是否已存在
    const existingUser = await mongoose.model('User').findOne({ phone });
    
    // 生成验证码（模拟）
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 在实际应用中，这里应该发送短信验证码
    console.log(`向 ${phone} 发送验证码: ${code}`);
    
    // 临时存储验证码（实际应该存储在Redis中并设置过期时间）
    // 这里为了简化，直接返回成功
    
    res.json({
      success: true,
      message: '验证码发送成功',
      isRegistered: !!existingUser
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { phone, code, nickname, avatar } = req.body;
    
    if (!phone || !nickname) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    
    // 检查用户是否已存在
    const existingUser = await mongoose.model('User').findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }
    
    // 创建新用户
    const newUser = await mongoose.model('User').create({
      phone,
      nickname,
      avatar: avatar || `https://api.dicebear.com/7.x/miniavs/svg?seed=${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: newUser._id, phone },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          _id: newUser._id,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          phone: newUser.phone
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: '请输入手机号' });
    }
    
    // 查找用户
    const user = await mongoose.model('User').findOne({ phone });
    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, phone },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          _id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 刷新令牌
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: '请提供刷新令牌' });
    }
    
    // 验证刷新令牌
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
    );
    
    // 查找用户
    const user = await mongoose.model('User').findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    // 生成新的访问令牌
    const newToken = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(401).json({ success: false, message: '无效的刷新令牌' });
  }
});

// 获取用户信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const user = await mongoose.model('User').findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/info', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const { nickname, avatar } = req.body;
    
    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (avatar) updateData.avatar = avatar;
    updateData.updatedAt = new Date();
    
    const updatedUser = await mongoose.model('User').findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({
      success: true,
      message: '更新成功',
      data: {
        _id: updatedUser._id,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 挂载路由
app.use('/api/users', router);

// 导出serverless函数
module.exports.handler = serverless(app);