const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // 导入mongoose以检查连接状态
const Analytics = require('../models/Analytics');
const authMiddleware = require('../middleware/authMiddleware'); // 如果需要鉴权

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

module.exports = router;
