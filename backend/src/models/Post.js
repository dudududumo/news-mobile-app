/**
 * 文章数据模型
 * 用于存储文章内容、评论和相关信息
 */
const mongoose = require('mongoose');

/**
 * 评论数据模式
 * @typedef {Object} CommentSchema
 * @property {ObjectId} user - 用户ID（必填，关联User模型）
 * @property {string} content - 评论内容（必填）
 * @property {Date} createdAt - 评论创建时间（默认当前时间）
 */
const commentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * 文章数据模式
 * @typedef {Object} PostSchema
 * @property {string} title - 文章标题（默认空字符串）
 * @property {string} content - 文章内容（必填）
 * @property {Array<string>} images - 文章图片URL数组
 * @property {Array<string>} tags - 文章标签数组
 * @property {ObjectId} author - 作者ID（必填，关联User模型）
 * @property {number} views - 文章浏览量（默认0）
 * @property {number} likes - 文章点赞数（默认0）
 * @property {Array<ObjectId>} likesUsers - 点赞用户ID列表（关联User模型）
 * @property {Array<CommentSchema>} comments - 文章评论列表
 * @property {number} commentsCount - 评论数量（默认0）
 * @property {string} status - 文章状态（默认'published'）
 * @property {Date} createdAt - 文章创建时间（默认当前时间）
 * @property {Date} editAt - 文章编辑时间
 */
const postSchema = new mongoose.Schema({
  title: { 
    type: String, 
    default: '' 
  }, // 必须有这一行
  content: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  tags: [{ 
    type: String 
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: { 
    type: Number, 
    default: 0 
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  likesUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }], // 点赞用户列表
  comments: [commentSchema], // 评论列表
  commentsCount: { 
    type: Number, 
    default: 0 
  }, // 评论数量
  status: { 
    type: String, 
    default: 'published' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  editAt: { 
    type: Date 
  } // 编辑时间字段
});

/**
 * 文章数据模型
 */
module.exports = mongoose.model('Post', postSchema);