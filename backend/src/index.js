require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const path = require('path');
const multer = require('multer');
const COS = require('cos-nodejs-sdk-v5');

const app = express();

// --- CORS 配置 ---
app.use(cors({
  origin: [
    'https://news-mobile-app.vercel.app',
    'https://news-mobile-40kn0xvyn-dudududumos-projects.vercel.app',
    'http://localhost:5173',
    'https://news-mobile-app.zeabur.app'
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

// --- 腾讯云 COS 配置 ---
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});
const BUCKET = process.env.COS_BUCKET; // 例如 news-mobile-app-1381305971
const REGION = process.env.COS_REGION; // 例如 ap-beijing
const BASE_URL = `https://${BUCKET}.cos.${REGION}.myqcloud.com`;

// --- 上传配置 (multer, 临时存储到内存) ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- 路由挂载 ---
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- 图片上传路由 ---
app.post('/api/posts/upload', upload.array('images', 9), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: '无文件' });
    }

    const uploadPromises = files.map(file => {
      const Key = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      return new Promise((resolve, reject) => {
        cos.putObject({
          Bucket: BUCKET,
          Region: REGION,
          Key,
          Body: file.buffer,
          ContentLength: file.size,
          ContentType: file.mimetype,
          StorageClass: 'STANDARD'
        }, (err, data) => {
          if (err) return reject(err);
          resolve(`${BASE_URL}/${Key}`);
        });
      });
    });

    const urls = await Promise.all(uploadPromises);
    res.json({ urls });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ message: '上传失败' });
  }
});

// --- 健康检查端点 ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// --- 错误处理中间件 ---
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- 404 处理 ---
app.use((req, res) => {
  res.status(404).json({
    message: '请求的资源不存在'
  });
});

// --- 启动服务 ---
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 服务端运行在端口 ${PORT}`);
});

// --- 优雅关闭 ---
process.on('SIGTERM', () => {
  console.log('正在关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

// --- 超时处理 ---
server.timeout = 120000; // 2分钟超时
