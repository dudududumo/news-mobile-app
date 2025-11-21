// backend/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const otpManager = require('../utils/otpManager');

// 内存中模拟用户数据（用于开发模式下无数据库连接时）
let mockUsers = {};
const USE_MOCK_MODE = true; // 开发模式开关，无数据库时设为true

// 生成 Token 的辅助函数
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-dev-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// 模拟用户查找和创建（无数据库模式）
const mockFindOrCreateUser = (phone, nickname) => {
  // 生成模拟用户ID
  const mockUserId = `mock_${phone}`;

  if (!mockUsers[mockUserId]) {
    mockUsers[mockUserId] = {
      _id: mockUserId,
      phone,
      nickname: nickname || `Reader_${phone.slice(-4)}`,
      avatar: '',
      lastLoginAt: new Date()
    };
    console.log(`[Mock] 创建模拟用户: ${mockUserId}`);
  } else {
    mockUsers[mockUserId].lastLoginAt = new Date();
    console.log(`[Mock] 更新模拟用户登录时间: ${mockUserId}`);
  }

  return mockUsers[mockUserId];
};

// 1. 发送验证码
exports.sendCode = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: '手机号不能为空' });

  // 检查限制策略
  const check = otpManager.canSendOtp(phone);
  if (!check.allowed) {
    return res.status(429).json({ message: check.msg });
  }

  // 生成随机 4 位验证码 (开发环境固定 1234 方便测试，生产环境用 Math.random)
  const code = '1234';

  // 存入管理器
  otpManager.saveOtp(phone, code);

  // TODO: 接入阿里云短信 API 发送真实短信
  console.log(`[SMS Mock] 手机号: ${phone}, 验证码: ${code}`);

  res.json({ message: '验证码发送成功' });
};

// 2. 登录 / 注册（新增 nickname 参数逻辑）
exports.login = async (req, res) => {
  // 新增 nickname 参数解构
  const { phone, code, nickname } = req.body;

  // 校验验证码
  const verify = otpManager.verifyOtp(phone, code);
  if (!verify.valid) {
    return res.status(400).json({ message: verify.msg });
  }

  try {
    let user;

    if (USE_MOCK_MODE) {
      // 使用模拟模式
      console.log('[Mock Mode] 使用内存模拟用户数据');
      user = mockFindOrCreateUser(phone, nickname);
    } else {
      // 查找用户
      let user = await User.findOne({ phone });

      // 逻辑分支：
      // 1. 如果用户不存在（视为注册），优先使用前端传的昵称，无则赋默认值
      if (!user) {
        user = await User.create({
          phone,
          nickname: nickname || `Reader_${phone.slice(-4)}` // 替换原默认值为 Reader_xxx
        });
      } else {
        // 2. 如果是登录，暂不处理昵称修改（可在此扩展「登录后更新昵称」的逻辑）
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();
    }

    // 签发 Token
    const token = generateToken(user._id);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 前端需要的时间戳

    // 返回数据（保留原代码的 avatar 字段，保证数据完整性）
    res.json({
      token,
      expiresAt,
      user: {
        id: user._id,
        nickname: user.nickname,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('登录/注册异常:', err); // 新增错误日志，方便排查
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 3. 刷新 Token (对应前端的 refresh 逻辑)
exports.refreshToken = async (req, res) => {
  const { token } = req.body; // 旧 Token
  if (!token) return res.status(400).json({ message: 'Token 缺失' });

  try {
    // 验证旧 token (即使过期了，只要签名是对的，就刷新)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    const newToken = generateToken(decoded.id);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    res.json({ token: newToken, expiresAt });
  } catch (err) {
    console.error('刷新 Token 异常:', err); // 新增错误日志
    res.status(401).json({ message: 'Token 无效' });
  }
};