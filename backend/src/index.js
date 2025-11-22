require('dotenv').config();
// 按照要求的顺序引入模块
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// 中间件
// 加强CORS配置，解决ERR_BLOCKED_BY_ORB错误
app.use(cors({
  origin: 'http://localhost:5173', // 明确指定前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // 允许携带凭据
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// --- 关键修改：增加 limit 限制 ---
// 将限制提高到 50MB，解决大图上传报错 "PayloadTooLargeError"
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 数据库连接 - 增加连接选项以解决超时问题
mongoose.connect(process.env.MONGO_URI, {
  connectTimeoutMS: 30000, // 延长连接超时时间到30秒
  socketTimeoutMS: 45000,  // 延长套接字超时时间
  retryWrites: true,
  autoIndex: true,
  serverSelectionTimeoutMS: 30000,
  family: 4 // 使用IPv4，避免IPv6可能的问题
})
  .then(() => console.log('✅ MongoDB 已连接'))
  .catch(err => {
    console.error('❌ 数据库连接失败:', err);
    console.log('⚠️  如果MongoDB未运行，请先启动MongoDB服务');
  });

// 路由挂载
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts'); // 加载posts路由
const analyticsRoutes = require('./routes/analytics');

app.use('/api/posts', postRoutes); // 注意：这里没有加 authMiddleware
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes); // 挂载analytics路由

// 静态文件托管
// 对应上面路由里的 uploadDir 位置
// 如果 index.js 在 backend/src 下，这里指向 backend/uploads
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务端运行在 http://localhost:${PORT}`);
});
