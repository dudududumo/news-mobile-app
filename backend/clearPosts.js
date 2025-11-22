// 清理脚本：删除MongoDB中的posts集合数据
const mongoose = require('mongoose');
const Post = require('./src/models/Post');

// 连接数据库
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/redbook', {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  autoIndex: true,
  serverSelectionTimeoutMS: 30000,
  family: 4
})
.then(async () => {
  console.log('✅ MongoDB 已连接');
  
  // 清空posts集合
  try {
    const result = await Post.deleteMany({});
    console.log(`✅ 成功删除 ${result.deletedCount} 条帖子记录`);
    
    // 可选：如果需要完全删除集合结构
    // await mongoose.connection.collection('posts').drop();
    // console.log('✅ posts集合已完全删除');
  } catch (err) {
    console.error('❌ 删除posts数据失败:', err);
  }
})
.catch(err => {
  console.error('❌ MongoDB连接失败:', err);
})
.finally(() => {
  // 关闭连接
  mongoose.connection.close();
  console.log('👋 数据库连接已关闭');
});