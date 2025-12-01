const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
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

// 定义Analytics模型（如果需要）
const Analytics = mongoose.model('Analytics', new mongoose.Schema({
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  url: { type: String },
  metadata: { type: Object }
}, { collection: 'analytics' }));

// 批量接收埋点数据
router.post('/batch', async (req, res) => {
  try {
    // 首先检查数据库连接状态
    const dbState = mongoose.connection.readyState;
    console.log('Database connection state:', dbState); // 0:disconnected, 1:connected, 2:connecting, 3:disconnecting

    if (dbState !== 1) {
      console.warn('Database not connected, skipping analytics save');
      // 在数据库未连接时，可以选择返回成功但不保存数据
      return res.status(200).json({
        success: true,
        count: 0,
        warning: 'Database not connected, analytics temporarily stored in memory'
      });
    }

    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events provided' });
    }

    // 转换数据格式以匹配 Schema
    const logs = events.map(e => ({
      event: e.event,
      timestamp: e.timestamp,
      url: e.url,
      metadata: e // 把其余字段存入 metadata
    }));

    console.log('Attempting to save analytics:', logs.length, 'events');

    // 为提高稳定性，限制每次插入的数量
    const batchSize = 100;
    let savedCount = 0;

    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      try {
        await Analytics.insertMany(batch, {
          ordered: false, // 允许部分插入成功
          rawResult: true
        });
        savedCount += batch.length;
      } catch (batchError) {
        console.error('Batch insert error, continuing with next batch:', batchError.message);
      }
    }

    console.log('Analytics save completed, saved:', savedCount, 'of', logs.length, 'events');
    res.status(200).json({
      success: true,
      count: savedCount,
      totalReceived: logs.length
    });
  } catch (error) {
    console.error('Analytics Error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to save analytics',
      error: error.message
    });
  }
});

// 挂载路由
app.use('/api/analytics', router);

// 导出serverless函数
module.exports.handler = serverless(app);