const express = require('express');
const router = express.Router();

// 临时路由 - 今天只测试登录功能，帖子功能稍后实现

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '帖子功能待实现',
    data: []
  });
});

module.exports = router;