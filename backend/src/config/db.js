/**
 * 数据库配置文件
 * 负责建立和管理与MongoDB的连接
 */

const mongoose = require('mongoose');

/**
 * 建立MongoDB数据库连接
 * @async
 * @returns {Promise<void>}
 * @throws {Error} - 连接失败时抛出错误
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 30000,
      family: 4
    });
    console.log('✅ MongoDB 已连接');
  } catch (err) {
    console.error('❌ 数据库连接失败:', err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  mongoose
};
