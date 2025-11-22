const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // 确保路径正确
const Post = require('./models/Post'); // 确保路径正确

// 加载环境变量
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/news-app';

const sampleImages = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=500&q=80',
  'https://images.unsplash.com/photo-1682687221038-404670e01d46?w=500&q=80',
  'https://images.unsplash.com/photo-1682695794816-7b9da18ed470?w=500&q=80',
  'https://images.unsplash.com/photo-1682686581854-5e71f58e7e3f?w=500&q=80',
  'https://images.unsplash.com/photo-1682695795557-1744eff9596d?w=500&q=80',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=500&q=80',
  'https://images.unsplash.com/photo-1682685797769-481b48222ead?w=500&q=80',
  'https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=500&q=80',
  'https://images.unsplash.com/photo-1682687220067-dced9a881b56?w=500&q=80'
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 1. 清理旧数据 (可选)
    // await User.deleteMany({});
    // await Post.deleteMany({});
    // console.log('🧹 Old data cleared');

    // 2. 创建一个测试用户 (如果不想注册，可以用这个用户的数据)
    // 注意：这里为了简单直接写入，实际登录可能需要哈希密码，这里主要为了关联 ID
    let user = await User.findOne({ phone: '13800000000' });
    if (!user) {
      user = await User.create({
        phone: '13800000000',
        nickname: '官方测试员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        createdAt: new Date()
      });
      console.log('👤 Test user created');
    }

    // 3. 生成帖子数据
    const posts = [];

    // 类型A：纯文字短文
    posts.push({
      content: 'City Daily 正式上线啦！欢迎大家来这里分享生活点滴。这是第一条测试动态。',
      images: [],
      tags: ['置顶', '公告'],
      author: user._id,
      createdAt: new Date() // 刚刚
    });

    // 类型B：长文（测试折叠）
    posts.push({
      content: '今天去了一家非常棒的咖啡馆，叫做"Corner Cafe"。\n\n这里的氛围特别好，充满了咖啡的香气。我点了一杯拿铁，拉花非常精致，是一只天鹅的形状。\n\n坐在窗边，看着人来人往的街道，感觉时间都慢了下来。推荐大家周末来这里放松一下，带上一本书，可以坐整个下午。\n\n地址在市中心公园旁边，非常好找。如果是会员的话，还有打折哦！下次我们还要一起来尝试他们的甜点，据说提拉米苏是一绝。',
      images: [sampleImages[0]],
      tags: ['探店', '咖啡', '生活'],
      author: user._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2小时前
    });

    // 类型C：九宫格（测试多图布局）
    posts.push({
      content: '周末去公园采风，拍了很多好看的照片，风景真的很美！大家觉得哪张最好看？',
      images: sampleImages, // 9张图
      tags: ['摄影', '风景', '周末'],
      author: user._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5小时前
    });

    // 类型D：双图（测试网格）
    posts.push({
      content: '以前 vs 现在。时间过得真快呀。',
      images: [sampleImages[1], sampleImages[2]],
      tags: ['回忆'],
      author: user._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1天前
    });

    // 批量生成更多数据以测试滚动加载 (Infinite Scroll)
    for (let i = 0; i < 15; i++) {
      const numImages = Math.floor(Math.random() * 5); // 0-4张图
      const currentImages = sampleImages.slice(0, numImages);

      posts.push({
        content: `这是第 ${i + 1} 条自动生成的测试动态。用来测试滚动加载功能的流畅度。\n#测试数据 #${i}`,
        images: currentImages,
        tags: ['测试'],
        author: user._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 2)) // 每天一条，倒序测试
      });
    }

    await Post.insertMany(posts);
    console.log(`✨ Successfully seeded ${posts.length} posts!`);

    process.exit();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
