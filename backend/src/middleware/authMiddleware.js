const jwt = require('jsonwebtoken');
// 公开路径列表，这些路径允许未登录访问
const publicPaths = [
  // 🔴 关键修复：允许 GET / 路径通过（可能作为健康检查或默认API响应）
  { method: 'GET', path: '/' }, // <-- 新增这一行
  { method: 'GET', path: '/api/posts' },
  { method: 'GET', path: '/api/posts/:id' },
  { method: 'GET', path: '/api/posts/:id/comments' },
  { method: 'POST', path: '/api/analytics' }
];

module.exports = (req, res, next) => {
  try {
    console.log('--- 进入 Auth 中间件 ---');
    // 🔴 关键诊断：打印收到的完整 URL
    console.log(`-- 接收请求方法: ${req.method}, 路径: ${req.path}`);

    // 检查是否为公开路径
    const isPublicPath = publicPaths.some(publicPath => {
      if (req.method !== publicPath.method) return false;

      // 匹配根路径 /
      if (publicPath.path === '/' && req.path === '/') {
        return true;
      }

      // 匹配 /api/posts
      if (publicPath.path === '/api/posts' && req.path === '/api/posts') {
        return true;
      }

      // 匹配 /api/posts/ID 或 /api/posts/ID/comments
      if (publicPath.path === '/api/posts/:id' && req.path.match(/^\/api\/posts\/[^\/]+$/)) {
        return true;
      }

      // 匹配 /api/posts/ID/comments
      if (publicPath.path === '/api/posts/:id/comments' && req.path.match(/^\/api\/posts\/[^\/]+\/comments$/)) {
        return true;
      }

      // 匹配 /api/analytics
      if (publicPath.path === '/api/analytics' && req.path === '/api/analytics') {
        return true;
      }

      return false;
    });

    // 放在 if (!authHeader) 块的前面
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 🔴 关键诊断：判断 isPublicPath 是 true 还是 false
      if (isPublicPath) {
        console.log('✅ 公开路径，允许未登录访问 (无Token)');
        req.user = null; // 设置用户为null表示未登录
        return next();
      } else {
        console.log(`❌ 缺少 Authorization 头，拒绝非公开路径 (isPublicPath: ${isPublicPath})`);
        return res.status(401).json({ message: '未登录' });
      }
    }

    // 场景 3: 存在 Token，尝试验证
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your_super_high_end_secret_key_2024';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
      console.log('✅ Token 解码成功:', decoded);

      const userId = decoded.userId || decoded.id || decoded._id;

      if (!userId) {
        console.error('❌ Token 中没有找到用户 ID 字段!');
        throw new Error('Token 格式错误: 缺少用户ID');
      }

      req.user = { userId: userId, phone: decoded.phone };
      console.log('👉 req.user 已赋值:', req.user);
      return next();

    } catch (e) {
      // 场景 4: Token 验证失败（过期、格式错误）
      console.error('❌ Token 验证失败:', e.message);

      if (isPublicPath) {
        // 核心修复: 公开路径，Token 无效，放行
        console.log('⚠️ 公开路径，Token 无效，但已放行');
        req.user = null; // 设置用户为null
        return next();
      } else {
        // 非公开路径，Token 无效 -> 拒绝
        return res.status(401).json({ message: 'Token 无效或已过期' });
      }
    }

  } catch (e) {
    // 处理 try 块中的其他意外错误
    console.error('❌ 认证中间件意外失败:', e.message);
    return res.status(500).json({ message: '服务器认证错误' });
  }
};