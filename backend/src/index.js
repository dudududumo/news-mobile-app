require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

const app = express();

// 中间件
app.use(cors()); // 允许前端跨域
app.use(bodyParser.json());

// 数据库连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB 已连接'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

// 路由挂载
app.use('/auth', authRoutes);

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务端运行在 http://localhost:${PORT}`);
});
