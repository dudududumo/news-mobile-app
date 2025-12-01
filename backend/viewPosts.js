const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function viewPosts() {
  let client;

  try {
    // 使用MongoClient直接连接，便于查看原始数据
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/news-app';
    console.log(`正在连接到数据库: ${uri}`);

    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB 已连接');

    const db = client.db();
    const postsCollection = db.collection('posts');

    // 获取所有帖子，限制前5条以便查看
    console.log('\n📄 查看posts集合中的内容（最多5条）:');
    const posts = await postsCollection.find({}).limit(5).toArray();

    if (posts.length === 0) {
      console.log('⚠️  没有找到帖子数据');
    } else {
      posts.forEach((post, index) => {
        console.log(`\n--- 帖子 ${index + 1} ---`);
        console.log(`ID: ${post._id}`);
        console.log(`内容: ${post.content || '无内容'}`);
        console.log(`用户ID: ${post.userId || '未知'}`);
        console.log(`创建时间: ${post.createdAt ? new Date(post.createdAt).toLocaleString() : '未知'}`);
        console.log(`图片: ${post.imageUrl ? post.imageUrl : '无图片'}`);
        console.log(`点赞数: ${post.likes || 0}`);
      });
    }

    // 查看users集合的基本信息
    console.log('\n👥 查看users集合信息:');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`总用户数: ${userCount}`);

    // 获取前3个用户的基本信息
    const users = await usersCollection.find({}).limit(3).project({ _id: 1, username: 1, email: 1, avatar: 1 }).toArray();
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`用户名: ${user.username || '未设置'}`);
      console.log(`邮箱: ${user.email || '未设置'}`);
    });

  } catch (error) {
    console.error('❌ 查看数据库内容时出错:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 数据库连接已关闭');
    }
  }
}

viewPosts();