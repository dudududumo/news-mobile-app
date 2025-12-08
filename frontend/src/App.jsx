// React核心库
import React, { useState, useEffect } from 'react';

// 路由库
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// 页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';

// 服务和工具
import { getToken } from './services/axios';

// 样式文件
import './App.css';

/**
 * 路由保护组件
 * 用于保护需要登录才能访问的页面
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 被保护的子组件
 * @returns {React.ReactNode} 渲染的组件
 */
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  
  // 检查是否有有效的登录令牌
  if (!token || !token.token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * AppContent 组件
 * 应用的主要内容组件，包含路由配置和全局状态管理
 * @returns {React.ReactNode} 渲染的组件
 */
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getToken();
  
  // 路由状态
  const isHomeRoute = location.pathname === '/';
  const isAuthenticated = token && token.token;
  
  // 页面导航时自动滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 用户信息状态管理
  const [currentUser, setCurrentUser] = useState(() => {
    // 从 localStorage 初始化用户信息
    const savedUser = localStorage.getItem('userInfo');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /**
   * 更新用户信息的统一方法
   * @param {Object|null} newUser - 新的用户信息，null表示登出
   */
  const updateUserInfo = (newUser) => {
    if (newUser === null) {
      localStorage.removeItem('userInfo');
    } else {
      localStorage.setItem('userInfo', JSON.stringify(newUser));
    }
    setCurrentUser(newUser); // 触发所有依赖组件的重新渲染
  };

  return (
    <div className="App">
      <Routes>
        {/* 登录页面 */}
        <Route 
          path="/login" 
          element={<Login updateUserInfo={updateUserInfo} />} 
        />
        
        {/* 创建帖子页面（需要登录） */}
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } 
        />
        
        {/* 首页（帖子列表） */}
        <Route 
          path="/" 
          element={<Home 
            isHomeRoute={isHomeRoute} 
            userInfo={currentUser} 
            updateUserInfo={updateUserInfo} 
          />} 
        />
        
        {/* 帖子详情页面 */}
        <Route 
          path="/post/:id" 
          element={<PostDetail 
            userInfo={currentUser} 
            isAuthenticated={isAuthenticated} 
          />} 
        />
        
        {/* 默认重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/**
 * App 组件
 * 应用的根组件，设置路由上下文
 * @returns {React.ReactNode} 渲染的组件
 */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;