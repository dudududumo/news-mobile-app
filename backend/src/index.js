require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const path = require('path');

const app = express();

// --- CORS 配置 ---
// 前端 Vercel 域名 + 本地调试端口
app.use(cors({
  origin: [
    'https://news-mobile-app.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// --- Body Limit ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MongoDB 连接 ---
mongoose.connect(process.env.MONGO_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  autoIndex: true,
  serverSelectionTimeoutMS: 30000,
  family: 4
})
  .then(() => console.log('✅ MongoDB 已连接'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

// --- 路由挂载 ---
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- 静态文件托管 ---
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// --- 启动服务 ---
// 强制监听 Zeabur 默认暴露端口 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 服务端运行在端口 ${PORT}`);
});
