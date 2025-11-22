const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log('--- 进入 Auth 中间件 ---');

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ 缺少 Authorization 头');
      return res.status(401).json({ message: '未登录' });
    }

    const token = authHeader.split(' ')[1];
    // 这里打印 Token 是为了确保前端传过来了
    // console.log('Token:', token); 

    const secret = process.env.JWT_SECRET || 'your_super_high_end_secret_key_2024';
    const decoded = jwt.verify(token, secret);

    // 🔥 打印解码后的 Token 内容，看看里面到底是 id 还是 userId
    console.log('✅ Token 解码成功:', decoded);

    // 兼容各种写法
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      console.error('❌ Token 中没有找到用户 ID 字段!');
      return res.status(401).json({ message: 'Token 格式错误: 缺少用户ID' });
    }

    req.user = {
      userId: userId,
      phone: decoded.phone
    };

    console.log('👉 req.user 已赋值:', req.user);
    next();

  } catch (e) {
    console.error('❌ 认证失败:', e.message);
    return res.status(401).json({ message: 'Token 无效' });
  }
};
