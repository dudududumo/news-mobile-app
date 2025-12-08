/**
 * 认证控制器
 * 处理用户注册、登录、验证码发送等认证相关功能
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// 引入专门的OTP管理器模块
const otpManager = require('../utils/otpManager');

// 密码加密的盐值轮数
const SALT_ROUNDS = 10;

// JWT密钥（需与中间件配置一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_high_end_secret_key_2024';

/**
 * 生成随机验证码（6位数）
 * @returns {string} 6位数字验证码
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送验证码（带安全策略）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.phone - 用户手机号
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendCode = async (req, res) => {
  try {
    const { phone } = req.body;
    // 获取客户端IP地址
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    console.log(`📧 收到发送验证码请求: ${phone}, IP: ${clientIp}`);

    // 验证手机号格式（简单验证）
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '请输入正确的手机号' });
    }

    // 使用otpManager检查是否允许发送验证码
    const canSendResult = await otpManager.canSendOtp(phone);
    if (!canSendResult.allowed) {
      return res.status(429).json({ message: canSendResult.msg });
    }

    // 生成验证码
    const code = process.env.NODE_ENV === 'production'
      ? generateCode()
      : '123456'; // 开发环境使用固定验证码

    // 使用otpManager保存验证码
    await otpManager.saveOtp(phone, code);

    console.log(`🔑 为 ${phone} (IP: ${clientIp}) 生成验证码: ${code}`);

    // 在实际应用中，这里应该调用短信API发送验证码
    // await smsService.send(phone, `您的验证码是：${code}，有效期5分钟`);

    res.json({
      code: 200,
      message: '验证码已发送，有效期5分钟',
      // 开发环境把验证码直接返给前端方便调试，生产环境要删掉
      ...(process.env.NODE_ENV !== 'production' && { debugCode: code })
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ message: '发送失败，请稍后重试' });
  }
};

/**
 * 用户注册（带密码）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.phone - 用户手机号
 * @param {string} req.body.nickname - 用户昵称（可选）
 * @param {string} req.body.password - 用户密码
 * @param {string} req.body.code - 验证码
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.register = async (req, res) => {
  try {
    const { phone, nickname, password, code } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    console.log(`👤 尝试注册: ${phone}, IP: ${clientIp}`);

    // 验证必填字段
    if (!phone || !password || !code) {
      return res.status(400).json({ message: '请填写完整的注册信息' });
    }

    // 校验验证码
    const verifyResult = await otpManager.verifyOtp(phone, code);
    if (!verifyResult.valid) {
      if (verifyResult.msg.includes('锁定')) {
        return res.status(429).json({ message: verifyResult.msg });
      }
      return res.status(400).json({ message: verifyResult.msg });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: '该手机号已被注册' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建新用户
    const user = new User({
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      password: hashedPassword
    });
    await user.save();

    console.log('✅ 新用户注册成功:', user._id);

    // 生成Token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    res.json({
      code: 200,
      data: {
        token,
        expiresAt,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone
        }
      }
    });

  } catch (error) {
    console.error('❌ 注册失败:', error);
    res.status(500).json({ message: '注册服务出错' });
  }
};

/**
 * 用户登录（支持两种方式：密码登录和验证码登录）
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.phone - 用户手机号
 * @param {string} req.body.password - 用户密码（密码登录时必填）
 * @param {string} req.body.code - 验证码（验证码登录时必填）
 * @param {string} req.body.loginType - 登录方式：'password' 或 'sms'
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.login = async (req, res) => {
  try {
    const { phone, password, code, loginType } = req.body; // loginType: 'password' 或 'sms'
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    console.log(`👤 尝试登录: ${phone}, 方式: ${loginType}, IP: ${clientIp}`);

    // 根据登录方式处理
    if (loginType === 'password') {
      // 密码登录
      if (!phone || !password) {
        return res.status(400).json({ message: '请输入手机号和密码' });
      }

      // 查找用户
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(400).json({ message: '手机号或密码错误' });
      }

      // 验证密码
      if (!user.password) {
        return res.status(400).json({ message: '该账号未设置密码，请使用验证码登录' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: '手机号或密码错误' });
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();

      // 生成Token
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      res.json({
        code: 200,
        data: {
          token,
          expiresAt,
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
          }
        }
      });

    } else if (loginType === 'sms') {
      // 验证码登录
      if (!phone || !code) {
        return res.status(400).json({ message: '请输入手机号和验证码' });
      }

      // 校验验证码
      const verifyResult = await otpManager.verifyOtp(phone, code);
      if (!verifyResult.valid) {
        if (verifyResult.msg.includes('锁定')) {
          return res.status(429).json({ message: verifyResult.msg });
        }
        return res.status(400).json({ message: verifyResult.msg });
      }

      // 查找用户 - 只有已存在的用户才能通过验证码登录
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(400).json({ message: '该手机号未注册，请先注册' });
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();

      // 生成Token
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          phone: user.phone
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      res.json({
        code: 200,
        data: {
          token,
          expiresAt,
          user: {
            id: user._id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone
          }
        }
      });

    } else {
      return res.status(400).json({ message: '无效的登录方式' });
    }

  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({ message: '登录服务出错' });
  }
};

/**
 * 刷新Token
 * @async
 * @param {Object} req - Express请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.token - 旧的JWT Token
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.refreshToken = async (req, res) => {
  try {
    const { token: oldToken } = req.body;

    // 验证旧token
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });

    // 检查token是否有用户信息
    if (!decoded.userId) {
      return res.status(401).json({ message: '无效的token' });
    }

    // 生成新token，有效期24小时
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        phone: decoded.phone
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 计算新的过期时间
    const newExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    res.json({
      code: 200,
      data: {
        token: newToken,
        expiresAt: newExpiresAt
      }
    });
  } catch (error) {
    console.error('刷新token失败:', error);
    res.status(401).json({ message: '刷新失败，请重新登录' });
  }
};
