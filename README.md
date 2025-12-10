# citydaily-news-app 新闻资讯移动端应用

## 项目简介

这是一个基于React与Node.js开发、前后端分离的移动端新闻资讯应用，支持手机号验证码注册登录、富文本内容发布、Feed流无限滚动、点赞评论互动及AI智能标签等核心功能。前端采用React + Ant Design Mobile构建响应式界面，后端以Node.js + Express + MongoDB提供RESTful API，整体技术栈现代化，兼具良好用户体验与横向扩展能力。

## 核心功能

- **用户系统**：手机号验证码登录/注册、JWT 认证与会话管理
- **内容管理**：富文本文章发布、多图上传、AI 标签生成、草稿自动保存
- **Feed 流**：无限滚动加载、下拉刷新、点赞状态同步
- **内容详情**：完整内容展示、图片放大查看、相关推荐
- **互动功能**：点赞/取消点赞、评论系统
- **埋点分析**：前端行为采集、后端数据接收与存储

## 技术栈

### 前端
- React 18.2.0
- antd-mobile 5.34.0
- react-router-dom 6.20.0
- axios 1.6.2
- react-quill 2.0.0
- vite 5.0.8

### 后端
- Node.js
- express 4.21.2
- mongoose 8.20.1
- jsonwebtoken 9.0.2
- multer 1.4.5-lts.1
- 腾讯云 COS

## 部署方案

- **前端**：Vercel
- **后端**：Zeabur
- **图片存储**：腾讯云 COS

## 项目结构

```
citydaily-news-app/
├── backend/                # 后端服务
│   ├── src/                # 源代码
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由配置
│   │   └── services/       # 服务层
├── frontend/               # 前端应用
│   ├── src/                # 源代码
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # 服务层
│   │   └── utils/          # 工具函数
```

## 快速开始

### 前置要求
- Node.js 14+
- MongoDB 4.4+

### 本地开发

#### 后端服务
```bash
cd backend
npm install
# 创建 .env 文件并配置环境变量
npm start
```

#### 前端应用
```bash
cd frontend
npm install
npm run dev
```

## 开发说明

本项目已完成全面的代码规范优化，包括统一的命名规范、完整的注释文档、一致的错误处理机制和安全的配置管理。

## 实际部署环境

- **前端应用**: [https://news-mobile-app.vercel.app/](https://news-mobile-app.vercel.app/)
- **后端服务**: [https://news-mobile-app.zeabur.app/](https://news-mobile-app.zeabur.app/)
- **图片存储**: 腾讯云 COS
