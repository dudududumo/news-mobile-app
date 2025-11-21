# 11.21|完成登录注册模块|City Daily - 新闻移动应用（暂定名）

这是一个基于前后端分离架构的新闻移动应用项目，专注于提供简洁优雅的用户体验和完善的认证系统。

## 核心功能

### 1. 登录注册模块

#### 支持登录和注册
- 手机号验证码登录/注册一体化设计
- 支持自定义昵称注册
- 验证码自动倒计时功能
- 精美的登录/注册界面，支持Tab切换

#### 支持退出登录
- 登录状态管理
- 一键退出登录功能
- 登出后自动跳转到登录页面

### 2. 路由系统
- 基于React Router v6的路由管理
- 路由保护机制，确保受保护页面仅对登录用户可见
- 自动重定向处理

### 3. 认证机制
- JWT (JSON Web Token) 认证
- Token自动刷新机制
- 本地Token存储管理

## 项目结构

```
news-mobile-app/
├── README.md                  # 项目说明文档
├── backend/                   # 后端服务
│   ├── .env                   # 环境变量配置
│   ├── package.json           # 后端依赖
│   └── src/
│       ├── config/            # 配置文件
│       ├── controllers/       # 控制器
│       ├── index.js           # 后端入口
│       ├── middleware/        # 中间件
│       ├── models/            # 数据模型
│       ├── routes/            # 路由配置
│       └── utils/             # 工具函数
├── frontend/                  # 前端应用
│   ├── index.html             # HTML入口
│   ├── package.json           # 前端依赖
│   ├── src/
│   │   ├── App.jsx            # 应用主组件
│   │   ├── App.css            # 全局样式
│   │   ├── index.css          # 基础样式
│   │   ├── main.jsx           # React入口
│   │   ├── pages/             # 页面组件
│   │   │   ├── Home.jsx       # 首页
│   │   │   └── Login.jsx      # 登录/注册页面
│   │   └── services/          # 服务层
│   │       └── axios.js       # API请求封装
│   └── vite.config.js         # Vite配置
```

## 技术栈

### 前端
- **框架**: React 18+
- **构建工具**: Vite
- **路由**: React Router v6
- **UI组件库**: Ant Design Mobile
- **HTTP客户端**: Axios

### 后端
- **运行环境**: Node.js
- **Web框架**: Express
- **数据库**: MongoDB (支持模拟数据模式)
- **认证**: JWT (jsonwebtoken)
- **验证码管理**: 自定义OTP管理器

## 核心文件说明

### 前端文件

1. **Login.jsx**
   - 实现登录/注册一体化表单
   - 支持Tab切换登录和注册模式
   - 包含获取验证码和表单提交逻辑
   - 登录/注册成功后自动跳转至首页

2. **App.jsx**
   - 配置React Router路由系统
   - 实现ProtectedRoute路由保护组件
   - 设置默认重定向规则

3. **Home.jsx**
   - 登录成功后的首页
   - 包含退出登录功能

4. **axios.js**
   - Axios实例配置
   - 请求/响应拦截器
   - Token管理功能（获取、设置、清除、刷新）

### 后端文件

1. **authController.js**
   - 实现发送验证码、登录/注册、刷新Token等API
   - 支持模拟数据模式（无需数据库）
   - 验证码生成和验证逻辑

2. **auth.js** (路由)
   - 定义认证相关的API路由
   - 映射控制器方法到具体路由

3. **index.js**
   - Express应用初始化
   - 中间件配置
   - 路由挂载
   - 服务启动逻辑

## 环境配置

### 后端环境变量 (.env)
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/citydaily
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

### 前端环境变量 (.env)
```
VITE_API_URL=/api
```

## 开发指南

### 安装依赖

1. 后端依赖安装
```bash
cd backend
npm install
```

2. 前端依赖安装
```bash
cd frontend
npm install
```

### 启动开发服务器

1. 启动后端服务
```bash
cd backend
node src/index.js
# 服务运行在 http://localhost:3000
```

2. 启动前端开发服务器
```bash
cd frontend
npm run dev
# 前端运行在 http://localhost:5174
```

## 测试指南

### 登录测试

1. **访问登录页面**: http://localhost:5174/

2. **测试账号**:
   - 手机号: 任意有效手机号格式（如13800138000）
   - 验证码: 1234（开发环境固定验证码）

3. **注册测试**:
   - 切换到「注册」Tab
   - 输入昵称、手机号
   - 输入验证码: 1234
   - 注册成功后会自动登录并跳转到首页

### API接口测试

1. **发送验证码**
```bash
POST http://localhost:5174/api/auth/send-code
Content-Type: application/json

{
  "phone": "13800138000"
}
```

2. **登录/注册**
```bash
POST http://localhost:5174/api/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "1234",
  "nickname": "测试用户"  # 注册时可选
}
```

3. **刷新Token**
```bash
POST http://localhost:5174/api/auth/refresh
Content-Type: application/json

{
  "token": "your-existing-token"
}
```

## 功能特性

### 验证码系统
- 开发环境使用固定验证码1234，方便测试
- 包含发送频率限制
- 支持验证码过期时间设置

### Token管理
- 自动Token刷新机制（提前5分钟刷新）
- 请求队列处理，确保Token刷新时其他请求正常执行
- 过期Token自动清除

### 用户体验优化
- 登录/注册一体化设计，简化用户操作
- 精美的UI界面，符合现代设计趋势
- 自动跳转和状态管理
- 友好的提示信息

## 注意事项

1. 开发环境中使用模拟数据模式（`USE_MOCK_MODE = true`），无需数据库连接
2. 生产环境部署时，请确保:
   - 关闭模拟模式，配置真实数据库
   - 更改JWT密钥为强密钥
   - 集成真实短信服务发送验证码
3. 前端开发服务器配置了API代理，将`/api`路径代理到后端服务

## License

MIT
