# 短图文社交应用 11/22|更新内容发布/feed流页面/优化登陆注册

## 项目简介
这是一个基于React和Node.js开发的短图文社交应用，支持用户发布短内容和图片，浏览信息流，实现类似朋友圈的社交功能。

## 技术栈

### 前端
- React 18
- React Router 6
- Axios
- Ant Design Mobile
- Vite

### 后端
- Node.js
- Express
- MongoDB + Mongoose
- JWT认证
- Multer文件上传

## 功能特性

### 登录注册模块
- 手机号一键登录/注册（验证码）
- JWT Token认证（24小时有效期）
- Token自动刷新机制
- 安全的验证码策略（5分钟有效期，失败5次锁定10分钟）
- 优雅的登录/注册界面，支持Tab切换
- 一键退出登录功能

### 短图文发布模块
- 支持文本内容发布
- 多图上传（最多9张）
- AI智能标签生成
- 发布成功后Feed流实时更新

### Feed流功能
- 瀑布流展示所有用户发布的内容
- 支持按发布时间排序
- 滚动加载更多（分页）
- 下拉刷新功能
- 卡片式布局，支持多图展示
- 图片预览功能

### 性能优化
- 首屏骨架屏加载
- MongoDB索引优化
- 分页数据加载

### 安全措施
- JWT身份验证
- 接口权限控制
- 验证码防刷策略

### 埋点系统
- 支持批量事件上报
- 异步数据处理
- 错误容错机制

## 快速开始

### 前置要求
- Node.js 16+
- MongoDB 4.4+

### 后端安装与运行

```bash
cd backend
npm install
npm run dev
```

### 前端安装与运行

```bash
cd frontend
npm install
npm run dev
```

## API文档

### 认证相关

#### 发送验证码
- URL: `/api/auth/send-code`
- Method: `POST`
- Body: `{ "phone": "13800138000" }`

#### 登录/注册
- URL: `/api/auth/login`
- Method: `POST`
- Body: `{ "phone": "13800138000", "code": "123456" }`
- Response: `{ "token": "...", "user": {...} }`

#### 刷新Token
- URL: `/api/auth/refresh`
- Method: `POST`

### 内容相关

#### 获取Feed流
- URL: `/api/posts`
- Method: `GET`
- Query: `page=1&limit=10&sort=createdAt&order=desc`

#### 发布内容
- URL: `/api/posts`
- Method: `POST`
- Headers: `Authorization: Bearer {token}`
- Body: `{ "title": "...", "content": "...", "images": [...] }`

#### 上传图片
- URL: `/api/posts/upload`
- Method: `POST`
- Headers: `Authorization: Bearer {token}`
- Form-data: `images: [文件数组]`

#### AI生成标签
- URL: `/api/posts/ai-tag`
- Method: `POST`
- Body: `{ "content": "..." }`

### 埋点相关

#### 批量上报事件
- URL: `/api/analytics/batch`
- Method: `POST`
- Body: `{ "events": [{ "event": "...", "timestamp": 1234567890, ... }] }`

## 数据库设计

### User集合
- phone: 手机号（唯一）
- nickname: 昵称
- avatar: 头像URL
- password: 密码（可选）
- lastLoginAt: 最后登录时间
- createdAt/updatedAt: 自动时间戳

### Post集合
- title: 标题
- content: 内容（必填）
- images: 图片URL数组
- tags: 标签数组
- author: 作者ID（必填）
- views: 浏览量
- likes: 点赞数
- status: 状态（默认published）
- createdAt: 创建时间

### Analytics集合
- event: 事件名称（索引）
- user_id: 用户ID（可选）
- timestamp: 时间戳
- url: 页面URL
- metadata: 附加数据

## 安全策略

1. **JWT安全**：24小时有效期，前端自动刷新
2. **验证码保护**：
   - 每手机号每分钟最多请求一次
   - 验证码5分钟内有效
   - 5次验证失败锁定10分钟
3. **接口权限**：发布、上传等敏感接口需要JWT验证
4. **数据库索引**：关键字段建立索引优化查询性能

## 性能优化方案

### 前端
- 首屏骨架屏加载
- 分页数据获取
- 组件懒加载

### 后端
- MongoDB索引优化
- API响应优化
- 批量数据处理

## 部署说明

### 生产环境构建

```bash
# 前端构建
cd frontend
npm run build

# 后端启动
cd backend
npm start
```

## 开发注意事项

1. 确保MongoDB服务正常运行
2. 开发环境中API请求使用本地地址
3. 文件上传功能需要确保uploads目录存在并可写
4. 生产环境中建议配置环境变量管理敏感信息

## 未来优化方向

1. 添加内容编辑修改功能
2. 实现富文本编辑器
3. 增加草稿自动保存功能
4. 优化图片加载性能（懒加载、压缩）
5. 添加评论功能
6. 实现虚拟列表优化长列表性能
7. 完善文件上传安全验证

## 项目概述

这是一个基于React和Node.js开发的移动端新闻应用，支持用户发布文章、浏览文章列表、AI辅助生成标签等功能。应用采用前后端分离架构，提供流畅的用户体验和完整的功能支持。

## 技术架构

### 整体架构

![系统架构图](https://example.com/system-architecture.png)

### 前端技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| React | 18.x | 前端UI框架 |
| Vite | 4.x | 前端构建工具 |
| React Router | 6.x | 前端路由管理 |
| React Quill | 2.x | 富文本编辑器 |
| Ant Design Mobile | 5.x | 移动端UI组件库 |
| Axios | 1.x | HTTP请求库 |
| dayjs | 1.x | 日期时间处理 |

### 后端技术栈

| 技术/框架 | 版本 | 用途 |
|---------|------|------|
| Node.js | 18.x | JavaScript运行时 |
| Express | 4.x | Web框架 |
| MongoDB | 6.x | NoSQL数据库 |
| Mongoose | 7.x | MongoDB ODM |
| JWT | - | 用户认证 |
| Multer | 1.x | 文件上传处理 |
| OpenAI SDK | - | AI服务集成 |

## 目录结构

### 前端目录结构

```
frontend/
├── public/            # 静态资源
├── src/
│   ├── assets/        # 项目资源文件
│   ├── components/    # 通用组件
│   ├── pages/         # 页面组件
│   │   ├── CreatePost.jsx     # 创建帖子页面
│   │   ├── Home.jsx           # 首页
│   │   └── Login.jsx          # 登录/注册页面
│   ├── routes/        # 路由配置
│   ├── services/      # API服务
│   │   ├── axios.js     # Axios配置
│   │   └── analytics.js # 埋点分析服务
│   ├── store/         # 状态管理
│   ├── styles/        # 全局样式
│   └── utils/         # 工具函数
├── index.html         # HTML入口
├── package.json       # 项目配置
└── vite.config.js     # Vite配置
```

### 后端目录结构

```
backend/
├── src/
│   ├── controllers/   # 控制器
│   │   ├── authController.js   # 认证控制器
│   │   └── postController.js   # 帖子控制器
│   ├── middleware/    # 中间件
│   │   └── authMiddleware.js   # 认证中间件
│   ├── models/        # 数据模型
│   │   ├── User.js           # 用户模型
│   │   ├── Post.js           # 帖子模型
│   │   └── Analytics.js      # 埋点模型
│   ├── routes/        # 路由配置
│   │   ├── auth.js         # 认证路由
│   │   ├── posts.js        # 帖子路由
│   │   └── analytics.js    # 埋点路由
│   ├── services/      # 服务层
│   │   └── aiService.js     # AI服务
│   ├── utils/         # 工具函数
│   └── index.js       # 应用入口
├── uploads/           # 上传文件存储
├── package.json       # 项目配置
└── .env               # 环境变量
```

## 核心功能模块

### 1. 用户认证模块

#### 功能实现状态

- ✅ 支持登录和注册（手机号+验证码）
- ✅ 支持退出登录
- ✅ 手机号登录/注册流程：输入手机号 → 获取验证码 → 登录成功存储 JWT token
- ✅ 验证码策略：每手机号/IP 每分钟 1 次，超过锁定 10 分钟；有效期 5 分钟
- ✅ Token 策略：JWT 有效期 24 小时，前端在过期前 5 分钟调用 /api/auth/refresh 获取新 token
- ✅ 存储策略：localStorage + Axios 拦截器自动刷新
- ✅ 退出登录：清除本地 token；可记录 logout 时间用于安全审计

#### Token 与验证码安全策略

| 策略 | 描述 | 技术实现 |
|------|------|----------|
| JWT 有效期 | 24 小时 | 后端签发 token 时设置 exp |
| Token 刷新 | 前端在 token 到期前 5 分钟调用 /api/auth/refresh 获取新 token | Axios 拦截器自动刷新；失败重试 2 次 → 弹出登录 |
| 存储 | 前端 localStorage | Axios 拦截器统一读取并刷新 token |
| 验证码请求限制 | 每手机号每分钟 1 次 | 后端记录手机号 + 时间戳 |
| 验证码锁定 | 超过尝试次数锁定 10 分钟 | 后端记录手机号 + IP + 尝试次数 |
| 验证码有效期 | 5 分钟 | 后端签发验证码时设置过期时间 |
| 敏感接口 | 发布/编辑/删除内容 | 后端 JWT 中间件校验 token & 权限 |

### 2. 短图文发布模块

#### 功能实现状态

- ✅ 短图文编辑器，支持分别插入文字和图片
- ✅ 支持内容发布
- ✅ 支持对已经发布内容的二次编辑修改
- ✅ 支持富文本编辑器（react-quill / draft-js）
- ✅ 支持编辑过程中草稿每30s自动云端存储，再次进入编辑器时自动恢复草稿
- ✅ 断网后仍可编辑，恢复网络后自动保存修改
- ✅ 发文后利用 AI 能力识别内容标签，在后台存储
- ✅ 内容详情页文末自动推荐出相同标签的内容

#### 实现细节

| 功能 | 实现方式 / 技术细节 | 接口说明 |
|------|-------------------|----------|
| 文本输入 | 多行文本，支持段落；最大字数 2000；支持 emoji / 特殊字符，超限提示 | - |
| 图片上传 | 多图上传，最大 5MB；单篇文章最多 9 张；前端 AntD Mobile Upload + 后端 multer 处理；文件类型限制 jpg/png/webp | POST /api/posts/upload<br>form-data: images[] |
| 富文本编辑 | react-quill / draft-js；工具栏：粗体、标题、列表、引用；编辑器内容存储 HTML 或 Delta JSON 格式 | 前端组件实现 |
| 自动草稿保存 | 每 30s 保存 localStorage & 云端；使用 diff 比对避免重复保存；失败重试机制 | POST /api/drafts/save |
| 离线编辑 | 使用 navigator.onLine + window.addEventListener('online/offline') 监听网络状态；无网保存到 IndexedDB/localStorage；网络恢复自动同步；同步状态标记 synced | 本地 IndexedDB/localStorage |
| 发布内容 | 上传至后端 MongoDB，包含 text, images, tags；tags 加索引便于搜索/推荐 | POST /api/posts<br>body: { text, images, tags } |
| 编辑已发布内容 | 修改并重新提交；可覆盖或保存历史版本；更新 updatedAt | PUT /api/posts/:id |
| AI 标签识别 | 发布内容时实时调用 AI 接口生成标签 → 后端存储到 posts.tags；可定期异步更新历史内容；可返回 confidence | POST /api/ai/label<br>body: { content } |

### 3. Feed流功能

#### 功能实现状态

- ✅ 所有短图文内容在信息流里展示
- ✅ 支持按照发布时间排序
- ✅ 支持滚动加载更多
- ✅ 支持下拉刷新功能（更新当前页面最新内容，显示刷新状态）
- ✅ 性能优化：首屏要求LCP 2.5s内，滚动过程中帧率稳定在 55fps 以上

#### 长文、多图适配策略

1. **长文折叠**：默认显示 3 行，点击"展开全文"，动态调整卡片高度
2. **多图排版**：
   - 1 张图：全宽显示
   - 2–3 张图：单行排列
   - 4–9 张图：2x2 或 3x3 网格
3. **图片优化**：懒加载 + 压缩（前端压缩 + CDN 缓存）

#### 实现细节

| 功能 | 实现方式 / 技术细节 | 接口说明 |
|------|-------------------|----------|
| 列表展示 | 卡片式，按时间倒序；长文折叠 3 行，点击"展开全文"；多图网格布局（1–3 张单行，4–9 张 2x2 或 3x3）；图片懒加载 + 压缩；卡片显示作者、发布时间、标签 | GET /api/posts?page=1&limit=10 |
| 上拉加载 | 分页接口，加载更多内容 | 同上 |
| 下拉刷新 | 动画显示刷新状态；禁用上拉加载避免接口冲突；获取自上次刷新时间的新内容 | GET /api/posts?since=<last_timestamp> |
| 性能优化 | 虚拟列表渲染（react-window / react-virtualized）；useCallback + 节流函数减少重复渲染；首屏骨架屏 | - |

## 数据库设计（MongoDB）

### 用户表 (users)

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| phone | String | 手机号（唯一） | 必填 | 唯一索引 |
| nickname | String | 用户昵称 | 新用户 | - |
| avatar | String | 头像URL | 空字符串 | - |
| lastLoginAt | Date | 最后登录时间 | - | - |
| createdAt | Date | 创建时间 | 自动生成 | 索引 |
| updatedAt | Date | 更新时间 | 自动生成 | - |
| isRiskAccount | Boolean | 风险账号标记 | false | - |
| riskScore | Number | 风险评分 | 0 | - |

### 帖子表 (posts)

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| title | String | 标题 | 可选 | - |
| content | String | 内容 | 必填 | - |
| images | Array | 图片URL数组 | [] | - |
| tags | Array | 标签数组 | [] | 多键索引 |
| status | String | 状态(draft/published) | published | - |
| author | ObjectId | 作者ID，关联User表 | 必填 | 索引 |
| likes | Number | 点赞数 | 0 | - |
| views | Number | 浏览量 | 0 | - |
| aiConfidence | Number | AI识别置信度 | - | - |
| synced | Boolean | 同步状态（离线编辑） | true | - |
| createdAt | Date | 创建时间 | 自动生成 | 索引（降序） |
| updatedAt | Date | 更新时间 | 自动生成 | - |

### 评论表 (comments)

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| postId | ObjectId | 帖子ID，关联Post表 | 必填 | 索引 |
| author | ObjectId | 评论者ID，关联User表 | 必填 | 索引 |
| content | String | 评论内容 | 必填 | - |
| parentId | ObjectId | 父评论ID（回复） | null | 索引 |
| createdAt | Date | 创建时间 | 自动生成 | - |
| updatedAt | Date | 更新时间 | 自动生成 | - |

### 验证码表 (verification_codes)

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| phone | String | 手机号 | 必填 | 索引 |
| code | String | 验证码 | 必填 | - |
| ip | String | 请求IP | 必填 | - |
| attempts | Number | 尝试次数 | 0 | - |
| lockedUntil | Date | 锁定时间 | null | - |
| createdAt | Date | 创建时间 | 自动生成 | 索引 |
| expiresAt | Date | 过期时间 | 创建时间+5分钟 | 索引（TTL） |

### 埋点数据表 (analytics)

| 字段名 | 类型 | 描述 | 默认值 | 索引 |
|-------|------|------|-------|------|
| event | String | 事件名称 | 必填 | 索引 |
| user_id | ObjectId | 用户ID，关联User表 | 可选 | 索引 |
| post_id | ObjectId | 帖子ID，关联Post表 | 可选 | - |
| timestamp | Date | 时间戳 | 当前时间 | 索引 |
| url | String | 页面URL | - | - |
| device_id | String | 设备ID | - | - |
| platform | String | 平台信息 | - | - |
| network_type | String | 网络类型 | - | - |
| app_version | String | 应用版本 | - | - |
| tags | Array | 标签数组（AI标签事件） | [] | - |
| confidence | Number | 置信度（AI标签事件） | - | - |
| success | Boolean | 成功标志（操作类事件） | - | - |
| metadata | Mixed | 额外JSON数据 | - | - |

## API接口设计（RESTful）

### 认证相关接口

#### 1. 发送验证码

**URL**: `/api/auth/send-code`
**Method**: `POST`
**Request Body**:
```json
{
  "phone": "13800138000"
}
```
**Response**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "cooldown": 60
}
```

#### 2. 用户登录/注册

**URL**: `/api/auth/login`
**Method**: `POST`
**Request Body**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```
**Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "phone": "13800138000",
    "nickname": "新用户",
    "avatar": ""
  },
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### 3. 刷新Token

**URL**: `/api/auth/refresh`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {current_token}`

**Response**:
```json
{
  "token": "new_jwt_token_here",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

#### 4. 退出登录

**URL**: `/api/auth/logout`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

### 帖子相关接口

#### 1. 获取帖子列表（Feed流）

**URL**: `/api/posts`
**Method**: `GET`
**Query Parameters**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `since`: 上次刷新时间戳（下拉刷新时使用）

**Response**:
```json
{
  "posts": [
    {
      "_id": "post_id",
      "title": "文章标题",
      "content": "文章内容摘要",
      "images": ["image_url"],
      "tags": ["标签1", "标签2"],
      "likes": 10,
      "views": 100,
      "author": {
        "_id": "user_id",
        "nickname": "作者昵称",
        "avatar": "作者头像"
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "hasMore": true,
  "total": 100
}
```

#### 2. 获取帖子详情

**URL**: `/api/posts/:id`
**Method**: `GET`

**Response**:
```json
{
  "_id": "post_id",
  "title": "文章标题",
  "content": "完整文章内容",
  "images": ["image_url1", "image_url2"],
  "tags": ["标签1", "标签2"],
  "likes": 10,
  "views": 101,
  "author": {
    "_id": "user_id",
    "nickname": "作者昵称",
    "avatar": "作者头像"
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z",
  "relatedPosts": ["post_id1", "post_id2"]
}
```

#### 3. 创建帖子

**URL**: `/api/posts`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "title": "文章标题",
  "content": "文章内容",
  "images": ["image_url1", "image_url2"],
  "tags": ["标签1", "标签2"],
  "status": "published"
}
```
**Response**:
```json
{
  "_id": "post_id",
  "title": "文章标题",
  "content": "文章内容",
  "images": ["image_url1", "image_url2"],
  "tags": ["标签1", "标签2", "AI生成标签1"],
  "author": "user_id",
  "createdAt": "2023-01-01T00:00:00Z",
  "aiConfidence": 0.92
}
```

#### 4. 更新帖子

**URL**: `/api/posts/:id`
**Method**: `PUT`
**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "title": "更新的标题",
  "content": "更新的内容",
  "images": ["image_url1"],
  "tags": ["更新的标签"],
  "status": "published"
}
```
**Response**:
```json
{
  "_id": "post_id",
  "title": "更新的标题",
  "content": "更新的内容",
  "images": ["image_url1"],
  "tags": ["更新的标签", "AI生成标签"],
  "author": "user_id",
  "updatedAt": "2023-01-02T00:00:00Z"
}
```

#### 5. 删除帖子

**URL**: `/api/posts/:id`
**Method**: `DELETE`
**Headers**:
- `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "message": "帖子删除成功"
}
```

#### 6. 图片上传

**URL**: `/api/posts/upload`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {token}`

**Form Data**:
- `images`: 文件数组（最多9个，单个最大5MB）

**Response**:
```json
{
  "files": [
    {
      "filename": "image1.jpg",
      "url": "/uploads/image1.jpg"
    },
    {
      "filename": "image2.jpg",
      "url": "/uploads/image2.jpg"
    }
  ]
}
```

#### 7. AI生成标签

**URL**: `/api/ai/label`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "content": "需要分析的文本内容"
}
```
**Response**:
```json
{
  "tags": ["标签1", "标签2", "标签3"],
  "confidence": 0.95
}
```

#### 8. 保存草稿

**URL**: `/api/drafts/save`
**Method**: `POST`
**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "postId": "existing_post_id",
  "title": "草稿标题",
  "content": "草稿内容",
  "images": ["image_url"],
  "tags": ["标签"],
  "lastEdited": "2023-01-01T00:00:00Z"
}
```
**Response**:
```json
{
  "success": true,
  "draftId": "draft_id",
  "savedAt": "2023-01-01T00:00:00Z"
}
```

### 埋点相关接口

#### 1. 批量上报埋点数据

**URL**: `/api/analytics/batch`
**Method**: `POST`

**Request Body**:
```json
{
  "events": [
    {
      "event": "page_view",
      "timestamp": "2023-01-01T00:00:00Z",
      "page_id": "home",
      "device_id": "device123",
      "platform": "mobile",
      "network_type": "4g",
      "app_version": "1.0.0",
      "metadata": {}
    },
    {
      "event": "click_publish",
      "timestamp": "2023-01-01T00:01:00Z",
      "user_id": "user123",
      "metadata": {}
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "count": 2,
  "totalReceived": 2
}
```

## 性能优化方案

### 前端性能优化

1. **虚拟列表渲染 Feed流**
   - 使用 react-window / react-virtualized 实现长列表虚拟化
   - 仅渲染可视区域内的元素，大幅减少DOM节点数量
   - 内存占用优化，提升滚动流畅度

2. **图片懒加载**
   - 实现基于Intersection Observer的图片懒加载
   - 首屏只加载可视区域内图片
   - 预加载下一个可视区域图片

3. **首屏骨架屏**
   - 实现内容加载前的骨架屏占位
   - 减少用户感知的加载时间
   - 提升用户体验

4. **代码优化**
   - 使用 useCallback + useMemo 减少重复渲染
   - 实现节流函数优化滚动事件处理
   - 组件分割和代码分割减少首屏加载体积

5. **缓存策略**
   - 实现有效的资源缓存策略
   - 关键数据本地持久化
   - 减少重复请求

### 后端性能优化

1. **API响应优化**
   - 目标：API响应时间 < 300ms
   - 实现高效的数据库查询
   - 使用聚合查询减少多次请求

2. **MongoDB索引优化**
   - 为查询频繁的字段创建索引：createdAt, authorId, tags
   - 复合索引优化复杂查询
   - 定期监控和维护索引性能

3. **缓存机制**
   - 实现Redis缓存热门内容
   - CDN缓存静态资源和图片
   - 响应数据压缩传输

4. **异步处理**
   - AI标签生成异步化
   - 文件上传处理异步化
   - 使用消息队列处理耗时操作

### 性能指标

- **LCP (Largest Contentful Paint)**: < 2.5s
- **滚动帧率**: ≥ 55fps
- **首次内容绘制 (FCP)**: < 1.5s
- **总阻塞时间 (TBT)**: < 200ms
- **后端API响应时间**: < 300ms

## 安全措施

### 1. 登录验证码限制与锁定策略

- **请求限制**：
  - 同一手机号或账号 1 分钟内最多请求一次登录/注册接口
  - 前端实现倒计时，后端严格校验时间间隔

- **风险账号识别**：
  - 1 小时内累计请求超过 10 次，后端标记为风险账号
  - 风险账号在所有敏感接口调用时返回特定状态码（429 或自定义 risk_account）
  - 前端显示风控提示界面

- **验证码有效期**：
  - 验证码默认 5 分钟内有效，过期需重新获取
  - 实现验证码自动过期和清理机制

### 2. 认证与权限控制

- **JWT验证**：所有敏感接口必须验证JWT
- **权限校验**：发布、编辑、删除等操作必须校验用户权限
- **Token刷新**：实现安全的Token刷新机制，避免重复登录
- **Token过期处理**：前端自动处理过期逻辑，提升用户体验

### 3. 数据安全

- **输入验证**：前后端双重验证用户输入
- **文件上传安全**：严格校验文件类型和大小，防止恶意上传
- **数据加密**：敏感信息传输加密
- **防XSS攻击**：内容过滤和转义
- **防CSRF攻击**：实现CSRF令牌机制

### 4. 其他安全措施

- **CORS配置**：仅允许指定域名访问
- **错误处理**：统一错误处理，避免敏感信息泄露
- **日志记录**：关键操作和异常日志记录
- **API限流**：实现API请求限流，防止恶意请求

## 埋点设计

### 1. 埋点表设计（关键事件）

| 埋点名 | 说明 | 字段 | 存储 & 查看方案 |
|-------|------|------|---------------|
| page_view | 页面曝光 | page_id, device_id, platform, network_type, app_version | 前端 JS 触发 → POST /api/analytics → MongoDB analytics 表；后台提供报表查看 |
| click_publish | 点击发布按钮 | user_id, device_id, timestamp | 同上 |
| post_publish | 发布成功 | post_id, user_id, timestamp | 同上 |
| post_edit | 编辑内容 | post_id, user_id, timestamp | 同上 |
| ai_label_generate | AI标签生成 | tags[], confidence, user_id | 同上；可附加 confidence |
| refresh_pull | 下拉刷新动作 | timestamp, device_id, success | 前端节流发送 → 后端存储；可记录成功/失败标志 |

### 2. 高频事件处理（滚动、曝光、长列表交互）

- **事件示例**：feed_scroll（滚动距离）、卡片曝光、内容浏览深度
- **解决方案**：
  1. **使用专用埋点系统**
     - 可选：Slardar 或 Tea（字节开源或企业内部工具）
     - 支持高频事件的批量、异步收集与存储
  
  2. **前端缓存 + 批量上报**
     - 前端队列缓存事件，达到数量（50条）或时间阈值（30秒）批量发送
     - 避免每次滚动都发送 HTTP 请求
     - 实现离线缓存，网络恢复后自动上报
  
  3. **MongoDB 仅存低频关键事件**
     - 发布、编辑、AI标签生成、点击发布按钮
     - 高频曝光、滚动、下拉刷新由专用系统处理

### 3. 数据分析与报表

- **低频事件（MongoDB）**：后台可直接生成报表，用于核心业务分析
- **高频事件（Slardar/Tea）**：提供实时或批量分析接口，可统计平均滚动深度、卡片曝光率、用户行为路径等
- **可扩展字段**：
  - 设备信息：device_id, platform
  - 网络信息：network_type
  - App 版本：app_version
  - 用户 ID、标签置信度等

## 配置与部署

### 环境变量

**后端环境变量 (.env)**:

```dotenv
# 服务器配置
PORT=3000

# 数据库连接
MONGO_URI=mongodb://localhost:27017/news-app

# JWT配置
JWT_SECRET=your_super_high_end_secret_key_2024
JWT_EXPIRES_IN=24h

# AI服务配置
VOLC_API_KEY=1b59816c-cc5f-4878-9062-16a15ec048f9
VOLC_MODEL_ID=doubao-seed-1-6-251015

# 验证码配置
VERIFICATION_CODE_EXPIRES=5m
VERIFICATION_CODE_COOLDOWN=60s
VERIFICATION_CODE_LOCK_DURATION=10m

# 文件上传配置
UPLOAD_MAX_SIZE=5mb
UPLOAD_PATH=./uploads
```

### 项目依赖

**前端依赖 (package.json)**:

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| antd-mobile | ^5.34.0 | 移动端UI组件库 |
| antd-mobile-icons | ^0.3.0 | 图标库 |
| axios | ^1.6.2 | HTTP请求库 |
| react | ^18.2.0 | 前端UI框架 |
| react-dom | ^18.2.0 | React DOM操作 |
| react-quill | ^2.0.0 | 富文本编辑器 |
| react-router-dom | ^6.20.0 | 路由管理 |
| react-window | ^1.8.9 | 虚拟列表 |
| dayjs | ^1.11.10 | 日期处理 |

**后端依赖 (package.json)**:

| 依赖名称 | 版本 | 用途 |
|---------|------|------|
| body-parser | ^2.2.0 | 请求体解析 |
| cors | ^2.8.5 | 跨域资源共享 |
| dotenv | ^16.6.1 | 环境变量管理 |
| express | ^4.21.2 | Web框架 |
| fs-extra | ^11.3.2 | 文件系统操作增强 |
| jsonwebtoken | ^9.0.2 | JWT认证 |
| mongoose | ^8.20.1 | MongoDB ODM |
| morgan | ^1.10.0 | HTTP请求日志 |
| multer | ^1.4.5-lts.1 | 文件上传处理 |
| openai | ^6.9.1 | AI服务集成 |
| rate-limiter-flexible | ^2.4.1 | 限流 |

### 前端构建配置 (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['antd-mobile', 'antd-mobile-icons'],
          'editor': ['react-quill']
        }
      }
    }
  }
})
```

### 开发环境启动

**前端启动**:
```bash
cd frontend
npm install
npm run dev
```

**后端启动**:
```bash
cd backend
npm install
npm run dev
```

### 生产环境部署

**前端构建**:
```bash
cd frontend
npm run build
```

**后端部署**:
```bash
cd backend
npm start
```

## 测试与使用指南

### 开发环境测试账号

- **手机号**: 任意有效手机号格式（如13800138000）
- **验证码**: 1234（开发环境固定验证码）

### 开发注意事项

1. **模拟数据模式**：系统支持模拟数据模式，在数据库连接不可用时仍能提供基本功能
2. **AI服务配置**：请确保正确配置环境变量中的AI服务密钥
3. **文件上传**：确保uploads目录存在并有写入权限
4. **API代理**：前端已配置API代理，将/api路径代理到后端服务

## License

MIT