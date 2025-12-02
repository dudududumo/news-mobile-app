# 新闻资讯移动端应用

## 项目简介

这是一个基于React与Node.js开发、前后端分离的移动端新闻资讯应用，支持手机号验证码注册登录、富文本内容发布、Feed流无限滚动、点赞评论互动及AI智能标签等核心功能。前端采用React + Ant Design Mobile构建响应式界面，后端以Node.js + Express + MongoDB提供RESTful API，整体技术栈现代化，兼具良好用户体验与横向扩展能力。

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
  - [用户系统](#用户系统)
  - [内容管理](#内容管理)
  - [Feed流](#feed流)
  - [互动功能](#互动功能)
- [功能实现详情](#功能实现详情)
  - [用户系统功能实现](#用户系统功能实现)
  - [内容管理功能实现](#内容管理功能实现)
  - [Feed流功能实现](#feed流功能实现)
  - [互动功能实现](#互动功能实现)
- [技术栈](#技术栈)
  - [前端](#前端)
  - [后端](#后端)
  - [开发工具](#开发工具)
- [部署方案](#部署方案)
  - [前端部署 - Vercel](#前端部署---vercel)
  - [后端部署 - Zeabur](#后端部署---zeabur)
  - [图片存储 - 腾讯云COS](#图片存储---腾讯云cos)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
  - [前置要求](#前置要求)
  - [安装与运行](#安装与运行)
  - [开发测试账号](#开发测试账号)
  - [本地开发访问地址](#本地开发访问地址)
- [RESTful接口设计](#restful接口设计)
  - [1. 用户认证模块](#1-用户认证模块)
  - [2. 内容管理模块](#2-内容管理模块)
  - [3. 互动功能模块](#3-互动功能模块)

## 功能特性

### 用户系统
- **手机号验证码登录/注册**：支持手机号一键注册登录，验证码自动发送
- **用户信息管理**：用户可修改昵称和头像
- **JWT认证**：基于Token的无状态认证机制，保障系统安全性
- **会话管理**：自动处理Token过期和刷新

### 内容管理
- **文章发布**：支持富文本编辑，支持多图上传
- **文章编辑**：支持文章草稿保存和后续编辑
- **AI标签生成**：自动根据文章内容生成相关标签
- **文章删除**：用户可删除自己发布的文章

### Feed流
- **文章列表**：无限滚动加载，支持下拉刷新
- **文章详情**：支持富文本内容展示，图片查看
- **阅读计数**：自动记录文章阅读量
- **相关推荐**：基于文章标签智能推荐相关内容

### 互动功能
- **点赞/取消点赞**：支持文章点赞互动
- **评论系统**：支持文章评论，评论列表分页加载
- **评论删除**：用户可删除自己的评论
- **标签互动**：支持点击标签查看相关文章

## 功能实现详情

### 用户系统功能实现

| 功能 | 实现方式/技术细节 | 接口说明 |
|------|-----------------|--------|
| **手机号注册** | 前端实现手机号格式验证和验证码发送；后端使用bcrypt加密密码，生成JWT令牌并设置过期时间；支持开发环境测试验证码（123456） | POST `/auth/register` |
| **密码登录** | 前端实现表单验证（密码长度8-20位）；后端使用bcrypt验证密码，生成JWT令牌；支持记住密码功能 | POST `/auth/login` |
| **验证码登录** | 前端实现验证码倒计时功能（60秒）和手机号格式验证；后端验证验证码有效性（5分钟过期），生成JWT令牌 | POST `/auth/login` |
| **JWT认证** | 前端使用localStorage存储token和用户信息；axios拦截器自动添加Authorization头；后端验证JWT签名和过期时间 | 中间件应用于受保护路由 |
| **Token刷新** | 后端实现token刷新逻辑，生成新token并保持用户登录状态；前端在请求失败时自动尝试刷新token | POST `/auth/refresh` |
| **验证码发送** | 前端实现手机号格式验证和发送频率限制；后端生成6位数字验证码，设置5分钟过期，支持开发环境固定验证码 | POST `/auth/send-code` |
| **登录状态保持** | 使用localStorage存储token和用户信息，应用启动时自动恢复登录状态；实现登出功能清除所有存储数据 | 无特定API，使用浏览器存储 |
| **路由保护** | 基于React Router实现路由守卫，未登录用户访问受保护页面时自动重定向至登录页 | 无特定API，前端路由实现 |
| **密码强度验证** | 前端实现密码强度检测（包含数字和字母，长度8-20位）；提供实时密码强度反馈 | 无特定API，前端表单验证 |
| **用户信息存储** | 登录成功后将用户信息缓存在localStorage中，避免频繁请求用户数据；登出时清除所有本地缓存 | 无特定API，使用localStorage |

### 内容管理功能实现

| 功能 | 实现方式/技术细节 | 接口说明 |
|------|-----------------|--------|
| **短图文发布** | 支持文本内容和多张图片混合发布；实现内容预览功能；包含发布状态管理和错误提示 | POST `/posts` |
| **富文本编辑器** | 集成ReactQuill编辑器，自定义工具栏配置（粗体、斜体、列表、引用等）；支持中文界面；实现内容样式自定义 | 无特定API，前端组件实现 |
| **图片上传** | 支持多图上传功能，限制单张图片大小（5MB）；实现图片预览和删除功能；上传进度显示；后端使用multer处理文件存储 | POST `/posts/upload` |
| **AI标签生成** | 基于文章内容自动生成相关标签（最多5个）；实现本地兜底策略，当AI服务不可用时使用预设标签；支持手动修改生成的标签 | POST `/posts/ai-label` |
| **草稿自动保存** | 编辑器内容自动保存至localStorage；页面刷新或重新进入时恢复草稿；发布成功后清除草稿 | 无特定API，使用localStorage |
| **话题挑战跳转** | 支持从相关文章或标签页跳转至创建页面，并自动填充话题内容；提供创作引导功能 | 无特定API，导航参数传递 |
| **OpenAI集成** | 后端配置OpenAI客户端，使用API Key进行认证；实现请求超时和错误处理机制；支持模型参数配置 | 无特定API，后端服务调用 |
| **文件存储管理** | 后端使用multer配置文件上传路径和命名规则；支持文件类型验证（仅图片格式）；实现静态文件服务提供访问 | GET `/uploads/{filename}` |

### Feed流功能实现

| 功能 | 实现方式/技术细节 | 接口说明 |
|------|-----------------|--------|
| **下拉刷新** | 使用 `PullToRefresh` 组件包装内容区域，实现下拉刷新交互；`handleRefresh` 函数重置页码为1，添加时间戳避免缓存，重新获取最新数据，并从本地缓存恢复点赞状态 | GET `/posts?page=1&limit=10&t={timestamp}` |
| **无限滚动** | 使用 `InfiniteScroll` 组件实现无限滚动加载；`loadMore` 函数根据当前页码请求下一页数据，追加到现有数据列表；通过 `hasMore` 状态控制是否继续加载 | GET `/posts?page={page}&limit=10` |
| **滚动位置保持** | 利用 `sessionStorage` 保存和恢复滚动位置；组件挂载时读取并恢复滚动位置；监听滚动事件实时保存当前滚动坐标 | 无特定API，使用浏览器本地存储 |
| **点赞状态同步** | 实现本地缓存机制（`updateLikedStateCache`/`getLikedStateFromCache`）在Feed流和详情页间同步点赞状态；组件初始化和路由切换时自动从缓存更新点赞状态 | 结合 `/posts/{_id}/like` 和 `/posts/{_id}/unlike` 接口 |
| **首次加载骨架屏** | 在数据加载期间显示骨架屏组件（`Skeleton`），提升用户体验；使用条件渲染根据 `isFirstLoading` 状态切换显示 | 无特定API，前端实现 |
| **发布入口** | 页面右下角固定FAB（浮动操作按钮），点击导航至创建页面；根据登录状态控制显示和点击行为 | 无特定API，导航至 `/create` |
| **登录状态判断** | 在点赞、评论和发布等操作前检查登录状态；未登录时显示模态框提示并跳转登录页面 | 调用 `getToken()` 获取认证状态 |
| **用户信息展示** | 顶部导航栏根据登录状态显示用户头像和昵称或登录提示；支持点击退出登录操作 | 本地存储 `userInfo` |
| **退出登录** | 显示确认模态框，确认后清除token、用户信息和最后退出时间，并重定向至登录页 | 无特定API，调用 `clearToken()` 清除认证信息 |
| **数据初始化** | 组件挂载时自动初始化数据，调用 `handleRefresh` 加载第一页数据，并恢复保存的滚动位置 | GET `/posts?page=1&limit=10&t={timestamp}` |

### 互动功能实现

| 功能 | 实现方式/技术细节 | 接口说明 |
|------|-----------------|--------|
| **点赞功能** | 实现 `handleLike` 函数，支持点赞/取消点赞；使用乐观更新UI策略，先更新前端状态再请求后端；结合本地缓存机制保持状态同步；根据登录状态控制交互行为 | POST `/posts/{id}/like` 和 `/posts/{id}/unlike` |
| **评论功能** | `fetchComments` 获取评论列表，`handleSubmitComment` 提交新评论；支持评论区实时更新；实现评论输入框状态管理和表单验证；评论加载时显示骨架屏 | GET `/posts/{id}/comments`<br>POST `/posts/{id}/comments` |
| **图片查看器** | 使用 `ImageViewer.Multi` 组件实现图片查看器；支持多图浏览和切换；点击文章中的图片触发查看模式 | 无特定API，前端组件实现 |
| **登录状态交互控制** | 未登录用户点击互动按钮时显示 `ActionSheet` 提示框；支持直接跳转到登录页面并保留当前页面引用；登录状态判断影响点赞图标显示和交互可用性 | 无特定API，调用 `getToken()` 获取认证状态 |
| **相关阅读推荐** | `renderRelatedPosts` 函数渲染相关文章列表；支持点击跳转到相关文章详情页；包含话题标签展示 | 无特定API，文章详情接口返回相关文章数据 |
| **AI标签点击交互** | 点击AI标签触发 `handleChallenge` 函数，跳转到创建页面并自动填充话题内容；提供创作引导功能 | 无特定API，导航至 `/create` 并传递话题参数 |
| **滚动到评论区** | 支持通过URL状态参数直接滚动到评论区；评论按钮点击后平滑滚动到评论输入区域；使用 `commentsSectionRef` 引用实现精确定位 | 无特定API，前端DOM操作实现 |
| **点赞状态缓存同步** | 实现用户ID绑定的缓存机制（`updateLikedStateCache`/`getLikedStateFromCache`）；在Feed流和详情页间保持点赞状态一致性；登录/登出状态切换时自动更新显示 | 无特定API，使用 `sessionStorage` 实现 |
| **阅读数展示** | 文章详情页显示阅读数量统计；与点赞数和评论数一起构成内容互动数据面板 | 无特定API，文章详情接口返回阅读数 |
| **时间格式化显示** | 文章发布时间使用 `YYYY-MM-DD` 格式，评论时间使用相对时间（如"3分钟前"）；使用 `dayjs` 库进行时间处理 | 无特定API，前端 `dayjs` 库实现 |

## 技术栈

### 前端
| 类别 | 技术/库 | 版本 | 用途 |
|------|---------|------|------|
| 核心框架 | React | 18.2.0 | 构建用户界面 |
| UI组件库 | antd-mobile | 5.32.2 | 移动端UI组件 |
| 路由 | react-router-dom | 6.21.1 | 前端路由管理 |
| 状态管理 | zustand | 4.4.7 | 应用状态管理 |
| HTTP请求 | axios | 1.6.2 | API请求 |
| 编辑器 | react-quill | 2.0.0 | 富文本编辑 |
| 日期处理 | dayjs | 1.11.10 | 时间格式化 |

### 后端
| 类别 | 技术/库 | 版本 | 用途 |
|------|---------|------|------|
| 运行环境 | Node.js | - | JavaScript运行环境 |
| Web框架 | express | 4.18.2 | 后端服务框架 |
| 数据库 | mongoose | 8.0.0 | MongoDB对象建模 |
| 认证 | jsonwebtoken | 9.0.2 | JWT令牌生成与验证 |
| 密码加密 | bcryptjs | 2.4.3 | 密码安全存储 |
| 文件上传 | multer | 1.4.5-lts.1 | 文件处理 |
| AI服务 | openai | - | 智能标签生成 |

### 开发工具
| 类别 | 技术/库 | 版本 | 用途 |
|------|---------|------|------|
| 构建工具 | vite | 5.0.0 | 前端构建 |
| 代码规范 | eslint | 8.55.0 | 代码质量检查 |
| 开发服务器 | nodemon | 3.0.1 | 后端热重载 |

## 部署方案

### 前端部署 - Vercel

#### 部署步骤
1. 登录 [Vercel](https://vercel.com) 账号
2. 从GitHub导入项目仓库
3. 配置项目信息：
   - 根目录：选择 `frontend` 目录
   - 环境变量：设置 `NEXT_PUBLIC_API_URL` 为后端API地址
4. 点击部署按钮，等待部署完成

#### 关键配置
- **环境变量**：在Vercel项目设置中添加以下环境变量：
  - `NEXT_PUBLIC_API_URL`: 后端API的基础URL（如 `https://your-backend.zeabur.app/api`）
  - `NEXT_PUBLIC_COS_URL`: 腾讯云COS的访问域名

#### 部署优势
- 自动CI/CD：提交代码后自动触发部署
- 全球CDN：提供更快的访问速度
- 零配置SSL：自动提供HTTPS支持

### 后端部署 - Zeabur

#### 部署步骤
1. 登录 [Zeabur](https://zeabur.com) 平台
2. 创建新项目并导入GitHub仓库
3. 配置服务：
   - 根目录：选择 `backend` 目录
   - 环境变量：配置MongoDB连接、JWT密钥等
4. 部署并等待服务启动

#### 环境变量配置
在Zeabur项目设置中必须配置以下环境变量：

```
# MongoDB连接字符串
MONGODB_URI=mongodb://username:password@hostname:port/database

# JWT密钥
JWT_SECRET=your_secure_jwt_secret_key

# 服务器端口
PORT=3000

# AI服务配置
VOLC_API_KEY=your_volc_api_key
VOLC_MODEL_ID=doubao-seed-1-6-251015

# 腾讯云COS配置
COS_SECRET_ID=your_tencent_cloud_secret_id
COS_SECRET_KEY=your_tencent_cloud_secret_key
COS_BUCKET=your_cos_bucket_name
COS_REGION=your_cos_region

# 生产环境标识
NODE_ENV=production
```

#### 部署优势
- 简单易用：配置简单，部署快速
- 容器化部署：提供更好的隔离性和可扩展性
- 自动扩缩容：根据流量自动调整资源

### 图片存储 - 腾讯云COS

#### 配置步骤
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)
2. 创建COS存储桶，选择合适的区域
3. 获取访问密钥（SecretId和SecretKey）
4. 配置CORS，允许前端域名访问
5. 在后端环境变量中配置COS信息

#### 关键配置
- **存储桶权限**：设置为公共读私有写
- **CORS配置**：允许前端域名的GET、POST请求
- **安全设置**：开启防盗链保护资源安全

#### 集成方式
- 后端通过腾讯云SDK直接上传图片到COS
- 前端通过后端API间接上传图片，避免暴露密钥
- 使用CDN加速COS资源访问

## 项目结构

```
news-mobile-app/
├── frontend/               # 前端应用
│   ├── public/             # 静态资源
│   ├── src/                # 源代码
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── routes/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   ├── utils/          # 工具函数
│   │   ├── App.jsx         # 根组件
│   │   └── main.jsx        # 入口文件
│   ├── index.html          # HTML模板
│   └── package.json        # 前端依赖
├── backend/                # 后端服务
│   ├── src/                # 源代码
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由配置
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── index.js        # 入口文件
│   ├── uploads/            # 文件上传目录
│   └── package.json        # 后端依赖
```

## 快速开始

### 前置要求
- Node.js 14+ 环境
- MongoDB 4.4+ 数据库
- 推荐使用 VS Code 编辑器
- npm 或 yarn 包管理器

### 安装与运行

#### 实际部署环境
- **前端应用**: [https://news-mobile-app.vercel.app/](https://news-mobile-app.vercel.app/) - 使用Vercel部署
- **后端服务**: [https://news-mobile-app.zeabur.app/](https://news-mobile-app.zeabur.app/) - 使用Zeabur部署
- **图片存储**: [腾讯云COS](https://console.cloud.tencent.com/cos/bucket?bucket=news-mobile-app-1381305971) - news-mobile-app-1381305971

#### 本地开发环境搭建

##### 后端服务
1. 进入后端目录
   ```bash
   cd backend
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 配置环境变量（创建 .env 文件）
   ```
   # MongoDB连接字符串
   MONGODB_URI=mongodb://localhost:27017/info_app
   
   # JWT密钥
   JWT_SECRET=your_super_high_end_secret_key_2024
   
   # 服务器端口
   PORT=3000
   
   # AI服务配置
   VOLC_API_KEY=your_volc_api_key
   VOLC_MODEL_ID=doubao-seed-1-6-251015

   # 腾讯云COS配置
   COS_SECRET_ID=your_tencent_cloud_secret_id
   COS_SECRET_KEY=your_tencent_cloud_secret_key
   COS_BUCKET=news-mobile-app-1381305971
   COS_REGION=your_cos_region
   
   # 开发环境标识
   NODE_ENV=development
   ```
4. 启动服务
   ```bash
   npm run dev
   ```
   服务将在 http://localhost:3000 启动

##### 前端应用
1. 进入前端目录
   ```bash
   cd frontend
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 启动开发服务器
   ```bash
   npm run dev
   ```
   应用将在 http://localhost:5173 启动

### 开发测试账号
- 手机号: 任意有效手机号格式（如13800138000）
- 验证码: 123456（开发环境固定验证码）

### 本地开发访问地址
- 前端应用: http://localhost:5173
- 后端API: http://localhost:3000/api
- 图片资源: 本地开发时通过腾讯云COS存储

## RESTful接口设计

### 1. 用户认证模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/api/auth/send-code` | 发送验证码 | phone: String (手机号) | `{ success: Boolean, message: String, debugCode?: String }` |
| POST | `/api/auth/register` | 用户注册 | phone: String (手机号)<br>code: String (验证码)<br>nickname: String (昵称) | `{ token: String, user: { phone: String, nickname: String, avatar: String } }` |
| POST | `/api/auth/login` | 用户登录 | phone: String (手机号)<br>code: String (验证码) | `{ token: String, user: { phone: String, nickname: String, avatar: String } }` |
| POST | `/api/auth/refresh` | 刷新Token | token: String (当前token) | `{ token: String, expiresAt: Number }` |
| POST | `/api/auth/logout` | 用户登出 | token: String (可选) | `{ success: Boolean, message: String }` |

### 2. 内容管理模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/posts` | 获取文章列表 | page: Number (页码，默认1)<br>limit: Number (每页数量，默认10)<br>t: String (时间戳，可选) | `{ list: Array, hasMore: Boolean, total: Number }` |
| GET | `/api/posts/:id` | 获取文章详情 | id: String (文章ID) | `{ _id: String, title: String, content: String, images: Array, tags: Array, author: Object, likes: Number, commentsCount: Number, views: Number, isLiked: Boolean, createdAt: String }` |
| POST | `/api/posts` | 创建文章 | title: String (标题)<br>content: String (内容)<br>images: Array (图片URL数组)<br>status: String (状态，默认published) | `{ _id: String, title: String, content: String, images: Array, tags: Array, author: Object, createdAt: String }` |
| PUT | `/api/posts/:id` | 更新文章 | id: String (文章ID)<br>title: String (标题)<br>content: String (内容)<br>images: Array (图片URL数组) | `{ _id: String, title: String, content: String, images: Array, tags: Array, updatedAt: String }` |
| DELETE | `/api/posts/:id` | 删除文章 | id: String (文章ID) | `{ success: Boolean, message: String }` |
| POST | `/api/posts/upload` | 上传图片 | file: File (图片文件) | `{ url: String, filename: String }` |
| POST | `/api/posts/ai-label` | AI生成标签 | content: String (文章内容) | `{ tags: Array<String> }` |

### 3. 互动功能模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/api/posts/:id/like` | 点赞文章 | id: String (文章ID) | `{ success: Boolean, likes: Number, isLiked: Boolean }` |
| POST | `/api/posts/:id/unlike` | 取消点赞 | id: String (文章ID) | `{ success: Boolean, likes: Number, isLiked: Boolean }` |
| GET | `/api/posts/:id/comments` | 获取评论列表 | id: String (文章ID)<br>page: Number (页码，默认1)<br>limit: Number (每页数量，默认20) | `{ list: Array, hasMore: Boolean, total: Number }` |
| POST | `/api/posts/:id/comments` | 发表评论 | id: String (文章ID)<br>content: String (评论内容) | `{ _id: String, user: Object, content: String, createdAt: String }` |
| DELETE | `/api/posts/:id/comments/:commentId` | 删除评论 | id: String (文章ID)<br>commentId: String (评论ID) | `{ success: Boolean, message: String }` |
| POST | `/api/posts/:id/view` | 增加阅读数 | id: String (文章ID) | `{ success: Boolean, views: Number }` |

### 4. 用户相关模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 | 无（通过Token获取） | `{ _id: String, phone: String, nickname: String, avatar: String, createdAt: String }` |
| PUT | `/api/users/me` | 更新用户信息 | nickname: String (昵称)<br>avatar: String (头像URL) | `{ _id: String, phone: String, nickname: String, avatar: String }` |
| GET | `/api/users/me/posts` | 获取我的文章 | page: Number (页码，默认1)<br>limit: Number (每页数量，默认10) | `{ list: Array, hasMore: Boolean, total: Number }` |
| GET | `/api/users/me/liked` | 获取我的点赞 | page: Number (页码，默认1)<br>limit: Number (每页数量，默认10) | `{ list: Array, hasMore: Boolean, total: Number }` |

### 5. 标签相关模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/tags` | 获取热门标签 | limit: Number (数量限制，默认20) | `{ tags: Array<{ name: String, count: Number }> }` |
| GET | `/api/tags/:name/posts` | 获取标签相关文章 | name: String (标签名称)<br>page: Number (页码，默认1)<br>limit: Number (每页数量，默认10) | `{ list: Array, hasMore: Boolean, total: Number }` |

### 6. 系统管理模块

| 方法 | 路径 | 功能 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/analytics/dashboard` | 获取仪表盘数据 | 无 | `{ totalPosts: Number, totalUsers: Number, totalComments: Number, todayPosts: Number }` |
| GET | `/api/analytics/trends` | 获取趋势数据 | startDate: String (开始日期)<br>endDate: String (结束日期) | `{ dates: Array, posts: Array, users: Array }` |

### 接口设计规范

#### 认证机制
- 所有需要认证的接口使用JWT Token验证
- Token通过请求头Authorization传递：`Bearer {token}`
- Token有效期为24小时，可通过refresh接口刷新

#### 分页设计
- 列表类接口统一使用page和limit参数进行分页
- 响应中包含hasMore字段标识是否还有更多数据
- 响应中包含total字段显示总数

#### 错误处理
- 统一的错误响应格式：`{ success: false, code: String, message: String }`
- 常见错误码：
  - 400: 参数错误
  - 401: 未授权
  - 403: 禁止访问
  - 404: 资源不存在
  - 500: 服务器错误

#### 参数校验
- 所有输入参数进行严格校验
- 手机号格式验证（中国大陆手机号格式）
- 字符串长度限制
- 文件类型和大小限制（图片最大5MB）

#### 安全措施
- CORS跨域配置
- 请求频率限制
- SQL注入防护
- XSS攻击防护
- 敏感信息加密存储

## 数据库设计

### User模型

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| `phone` | String | 手机号（唯一） | 必填 | 唯一索引 |
| `nickname` | String | 用户昵称 | "新用户" | - |
| `avatar` | String | 头像URL | "" | - |
| `password` | String | 密码（加密存储） | undefined | - |
| `createdAt` | Date | 创建时间 | 自动生成 | - |
| `updatedAt` | Date | 更新时间 | 自动生成 | - |

### Post模型

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| `title` | String | 文章标题 | "" | - |
| `content` | String | 文章内容 | 必填 | - |
| `images` | Array<String> | 图片URL数组 | [] | - |
| `tags` | Array<String> | 标签数组 | [] | - |
| `author` | ObjectId | 作者ID，关联User | 必填 | 索引 |
| `views` | Number | 浏览量 | 0 | - |
| `likes` | Number | 点赞数 | 0 | - |
| `likesUsers` | Array<ObjectId> | 点赞用户列表 | [] | - |
| `comments` | Array<Comment> | 评论列表（嵌套文档） | [] | - |
| `commentsCount` | Number | 评论数量 | 0 | - |
| `status` | String | 状态（published/draft） | "published" | - |
| `createdAt` | Date | 创建时间 | 自动生成 | 索引（降序） |

### 评论子文档结构

| 字段名 | 类型 | 描述 | 默认值 |
|-------|------|------|-------|
| `user` | ObjectId | 评论者ID，关联User | 必填 |
| `content` | String | 评论内容 | 必填 |
| `createdAt` | Date | 创建时间 | 自动生成 |

### 验证码记录模型

| 字段名 | 类型 | 描述 | 默认值 |
|-------|------|------|-------|
| `phone` | String | 手机号 | 必填 |
| `code` | String | 验证码 | 必填 |
| `ip` | String | 请求IP | 必填 |
| `attempts` | Number | 尝试次数 | 0 |
| `expiresAt` | Date | 过期时间 | 创建时间+5分钟 |

## 开发说明

### 代码规范
- 前端使用ESLint进行代码质量检查
- 遵循React Hooks最佳实践
- 组件化开发，提高代码复用性
- 使用CSS变量进行样式管理

### 安全注意事项
- 敏感信息使用环境变量存储
- 密码使用bcrypt加密存储
- API接口添加JWT认证中间件保护
- 验证码防刷策略（5分钟有效期）
- 文件上传安全验证

### 开发注意事项
1. 确保MongoDB服务正常运行
2. 开发环境中API请求通过Vite代理到后端
3. 文件上传功能需要确保uploads目录存在并可写
4. 生产环境中建议配置环境变量管理敏感信息

## 架构设计

### 系统整体架构

这是一个基于前后端分离架构的移动端资讯应用，采用现代微服务设计理念，实现了高内聚、低耦合的系统架构。整体架构分为前端展示层、后端服务层、数据存储层和外部服务层四个主要部分。

![系统架构图](./assets/5.png)

### 前端架构设计

#### 组件层次结构

前端采用组件化、模块化设计，主要分为以下层次：

1. **路由层**：基于React Router管理应用路由，实现页面跳转和导航
2. **页面层**：核心业务页面，如登录页、首页、详情页等
3. **组件层**：可复用UI组件，按功能和业务领域划分
4. **服务层**：封装API调用、数据处理等业务逻辑
5. **状态管理层**：使用Zustand管理全局状态
6. **工具层**：提供通用工具函数和辅助方法

#### 数据流设计

前端数据流采用单向数据流模式，结合本地状态和全局状态管理：

![数据流设计图](./assets/1.png)

核心数据流处理方式：
- **页面内状态**：使用React useState和useReducer管理组件局部状态
- **全局状态**：使用Zustand管理跨组件共享状态（如用户信息、登录状态）
- **数据持久化**：使用localStorage和sessionStorage缓存关键数据
- **API交互**：通过axios封装统一的API请求，处理请求/响应拦截

#### 响应式设计

- 基于Ant Design Mobile组件库实现移动端响应式界面
- 支持不同屏幕尺寸的自适应布局
- 实现主题切换和深色模式支持

### 后端架构设计

#### 服务层结构

后端采用典型的MVC架构模式，按功能模块组织代码：

1. **路由层**：定义API端点和请求处理函数映射
2. **控制器层**：处理业务逻辑，协调模型和视图
3. **服务层**：封装核心业务规则和外部服务调用
4. **模型层**：定义数据结构和数据库交互
5. **中间件层**：提供认证、日志、错误处理等横切关注点
6. **工具层**：提供通用工具函数和辅助方法

#### API架构

- **RESTful设计**：遵循RESTful API设计规范，使用标准HTTP方法
- **版本控制**：API路径包含版本标识，支持API演进
- **统一响应格式**：标准化API响应结构，包含状态码、消息和数据
- **认证授权**：基于JWT的无状态认证机制
- **错误处理**：统一的错误处理中间件，规范化错误响应

#### 数据库架构

- **文档数据库**：使用MongoDB存储结构化数据
- **数据模型**：基于Mongoose定义对象模型和关系
- **索引优化**：为常用查询字段建立索引，提升查询性能
- **数据分片**：按时间维度分片存储大量事件数据

### 核心业务流程图

#### 用户认证流程

![用户认证流程图](./assets/2.png)

#### 内容发布流程

![内容发布流程图](./assets/3.png)

#### Feed流加载流程

![Feed流加载流程图](./assets/4.png)

### 扩展性设计

#### 水平扩展
- 无状态设计：服务层采用无状态设计，便于水平扩展
- 负载均衡：支持通过负载均衡器分发请求到多个服务实例
- 数据库扩展：支持MongoDB副本集和分片集群

#### 功能扩展
- 模块化设计：系统各部分高度模块化，便于功能扩展
- 插件机制：支持通过插件扩展系统功能
- API网关：预留API网关接口，支持未来微服务架构演进

#### 技术扩展
- 消息队列：预留消息队列集成接口，支持异步处理和系统解耦
- 缓存系统：支持Redis等分布式缓存系统集成
- 搜索引擎：支持Elasticsearch等搜索引擎集成，提升搜索性能

### 性能优化方案

#### 前端性能优化

- **代码分割**：使用动态导入(`React.lazy`和`Suspense`)实现代码按需加载，减少初始加载体积
- **资源优化**：图片使用WebP格式，实现图片懒加载，使用CDN加速静态资源
- **状态管理优化**：使用Context API + useReducer替代Redux，减少不必要的重渲染
- **缓存策略**：合理使用localStorage缓存不常变化的数据，减少重复请求
- **组件优化**：使用React.memo、useMemo和useCallback减少不必要的渲染

#### 后端性能优化

- **数据库索引**：为常用查询字段添加索引，提升查询性能
- **查询优化**：使用分页查询，避免一次性获取大量数据
- **缓存机制**：使用Redis缓存热点数据，减轻数据库压力
- **连接池**：使用数据库连接池管理数据库连接，提高连接复用率
- **异步处理**：使用Node.js异步特性处理并发请求，提高处理效率

#### 移动端特定优化

- **资源压缩**：对CSS、JavaScript和图片进行深度压缩，减少传输体积
- **离线缓存**：使用Service Worker实现关键资源离线缓存，支持弱网环境
- **App Shell模式**：实现App Shell架构，提供即时交互反馈
- **电量优化**：减少后台请求，优化网络调用频率，降低设备电量消耗
- **首屏加载优化**：使用骨架屏，实现关键内容优先渲染
- **网络优化**：实现请求合并、预连接、预加载等技术，减少网络延迟

#### 性能监控与分析

- **前端监控**：集成Performance API监测关键性能指标（FCP、LCP、FID等）
- **错误监控**：实现全局错误捕获和上报机制
- **用户体验监控**：跟踪用户操作路径和停留时间，分析性能瓶颈
- **性能基准测试**：建立性能基准线，定期进行自动化性能测试
- **监控工具集成**：推荐集成Sentry、Google Analytics等工具进行全面监控

### 埋点设计

#### 埋点方案
| 埋点名 | 说明 | 字段 | 存储 & 查看方案 |
| --- | --- | --- | --- |
| `user_login` | 用户登录事件 | `{ userId, deviceType, timestamp, loginMethod, isSuccess }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过管理后台的数据分析模块查看登录趋势和成功率 |
| `user_register` | 用户注册事件 | `{ userId, deviceType, timestamp, registerMethod, isSuccess }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过管理后台的数据分析模块查看注册转化率 |
| `post_view` | 文章浏览事件 | `{ userId, postId, timestamp, pageSource, timeSpent }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过内容分析模块查看热门文章和用户偏好 |
| `post_like` | 文章点赞事件 | `{ userId, postId, timestamp, actionType }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过互动分析模块查看点赞趋势 |
| `post_comment` | 文章评论事件 | `{ userId, postId, commentId, timestamp, commentLength }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过评论分析模块查看评论活跃度 |
| `search_query` | 搜索查询事件 | `{ userId, queryString, timestamp, resultsCount }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过搜索分析模块查看热门搜索词 |
| `page_view` | 页面浏览事件 | `{ userId, pageName, timestamp, referrer, duration }` | 存储：后端MongoDB集合`analytics_events`，按天分片<br>查看：通过页面分析模块查看页面访问量和停留时间 |

#### 高频事件处理

##### 滚动事件优化

- **节流处理**：使用`lodash.throttle`将滚动事件的触发频率限制为200ms一次，避免性能问题
- **滚动位置记录**：使用Intersection Observer API监测滚动位置，实现内容懒加载
- **滚动状态管理**：维护滚动状态机，避免重复触发相同状态的事件
- **实现示例**：
  ```javascript
  // 前端实现滚动节流
  import throttle from 'lodash.throttle';
  
  const handleScroll = throttle(() => {
    const scrollTop = window.pageYOffset;
    // 记录滚动位置和发送埋点
    trackScrollEvent(scrollTop);
  }, 200);
  
  window.addEventListener('scroll', handleScroll);
  ```

##### 曝光事件处理

- **可视区域检测**：使用Intersection Observer API精确监测元素进入可视区域
- **曝光去重**：使用Set数据结构存储已曝光元素ID，避免重复记录
- **批量上报**：将曝光事件收集到数组，定时批量上报到后端
- **实现示例**：
  ```javascript
  // 前端实现曝光检测
  const exposedItems = new Set();
  const exposureQueue = [];
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const itemId = entry.target.dataset.id;
        if (!exposedItems.has(itemId)) {
          exposedItems.add(itemId);
          exposureQueue.push({
            eventName: 'item_exposure',
            itemId,
            timestamp: Date.now(),
            position: entry.target.getBoundingClientRect()
          });
        }
      }
    });
  }, { threshold: 0.5 }); // 元素50%进入可视区域才触发
  
  // 批量上报
  setInterval(() => {
    if (exposureQueue.length > 0) {
      sendBatchEvents([...exposureQueue]);
      exposureQueue.length = 0;
    }
  }, 1000);
  ```

##### 长列表交互优化

- **虚拟滚动**：实现虚拟列表，只渲染可视区域内的元素，减少DOM节点数量
- **数据分页加载**：使用分页机制加载列表数据，避免一次性加载过多数据
- **预加载**：滑动到列表底部前，预加载下一页数据，提升用户体验
- **交互事件委托**：使用事件委托模式处理列表项的点击事件，减少事件监听器数量
- **实现示例**：
  ```javascript
  // 前端实现虚拟列表核心逻辑
  class VirtualList {
    constructor(container, options) {
      this.container = container;
      this.items = options.items;
      this.itemHeight = options.itemHeight;
      this.visibleCount = Math.ceil(container.clientHeight / this.itemHeight);
      
      this.updateVisibleItems = throttle(this.updateVisibleItems.bind(this), 16);
      container.addEventListener('scroll', this.updateVisibleItems);
    }
    
    updateVisibleItems() {
      const scrollTop = this.container.scrollTop;
      const startIndex = Math.floor(scrollTop / this.itemHeight);
      const endIndex = Math.min(startIndex + this.visibleCount + 2, this.items.length);
      
      // 只渲染可见区域及缓冲区的元素
      this.renderItems(startIndex, endIndex);
    }
  }
  ```

### 安全策略文档

### 1. Token 安全策略

#### 1.1 JWT 实现机制
- **生成方式**：使用 `jsonwebtoken` 库的 `jwt.sign()` 方法生成
- **存储信息**：包含 `userId` 和 `phone` 两个核心字段
- **密钥管理**：
  - 主要从环境变量 `JWT_SECRET` 获取
  - 提供默认密钥作为兜底方案
  - 生产环境必须通过环境变量设置强密钥
- **有效期管理**：
  - 令牌有效期设置为 24 小时
  - 返回 `expiresAt` 时间戳，便于前端管理令牌状态

#### 1.2 令牌验证机制
- **验证中间件**：`authMiddleware.js` 统一处理所有请求的身份验证
- **认证流程**：
  1. 从请求头 `Authorization` 中提取 `Bearer Token`
  2. 使用 `jwt.verify()` 验证令牌有效性
  3. 从解码信息中提取用户标识
  4. 将用户信息注入 `req.user` 对象供后续处理使用
- **错误处理**：
  - 令牌无效或过期时返回 401 状态码
  - 详细的日志记录便于问题排查

#### 1.3 安全防护措施
- **公开路径配置**：明确列出无需认证的 API 路径，如文章列表查询
- **灵活权限处理**：
  - 公开路径即使无令牌或令牌无效也允许访问
  - 非公开路径必须验证令牌有效性
- **防令牌劫持**：设置合理的有效期，减少令牌被盗用风险

#### 1.4 Token 刷新机制
- **刷新端点**：`/api/auth/refresh-token` 专门处理令牌刷新
- **刷新流程**：
  1. 验证旧令牌格式正确性
  2. 提取用户信息
  3. 生成新令牌并重置有效期
  4. 返回新令牌和过期时间
- **安全保障**：即使旧令牌已过期仍可用于刷新，避免用户频繁重新登录

### 2. 验证码 (OTP) 安全策略

#### 2.1 验证码生成与存储
- **生成规则**：6 位数字随机验证码
- **开发环境优化**：开发模式下使用固定验证码 `123456`
- **持久化存储**：使用 MongoDB 存储验证码信息
- **数据模型**：包含手机号、验证码、过期时间、尝试次数、锁定时间等字段

#### 2.2 频率限制机制
- **发送频率控制**：
  - 同一手机号每分钟最多发送一次验证码
  - 使用 `lastRequestTime` 记录上次请求时间
- **发送前检查**：发送前调用 `canSendOtp()` 验证是否允许发送
- **友好提示**：返回等待时间，提升用户体验

#### 2.3 验证安全策略
- **有效期管理**：验证码默认有效期为 5 分钟
- **一次性使用**：验证成功后立即从数据库删除，防止重用
- **错误尝试限制**：
  - 最多允许 5 次验证失败
  - 达到最大尝试次数后触发账号锁定

#### 2.4 锁定保护机制
- **锁定触发条件**：连续 5 次验证码错误
- **锁定时长**：锁定时间为 10 分钟
- **锁定状态记录**：`lockedUntil` 字段记录锁定结束时间
- **锁定解除**：时间到期自动解除锁定

#### 2.5 数据清理机制
- **定期清理**：每 30 分钟自动清理过期的验证码记录
- **清理规则**：删除已过期且锁定状态也已过期的记录
- **资源优化**：减少数据库存储空间占用，提高查询效率

#### 2.6 调试与监控
- **详细日志**：记录每次操作的详细信息，包括操作类型、手机号、结果等
- **状态日志**：关键节点记录当前存储状态
- **错误处理**：异常情况提供默认行为，确保服务稳定性

## 许可证

MIT License