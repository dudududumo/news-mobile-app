import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import { getToken } from './services/axios';
import './App.css';

// 路由保护组件
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token || !token.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();
  const isHomeRoute = location.pathname === '/';
  const token = getToken();
  const isAuthenticated = token && token.token;

  // 将用户信息从 localStorage 提升为状态
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  });

  // 创建一个统一更新用户信息的函数
  const updateUserInfo = (newUser) => {
    if (newUser === null) {
      localStorage.removeItem('userInfo');
    } else {
      localStorage.setItem('userInfo', JSON.stringify(newUser));
    }
    setCurrentUser(newUser); // 触发所有依赖组件的重新渲染
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login updateUserInfo={updateUserInfo} />} />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Home isHomeRoute={isHomeRoute} userInfo={currentUser} updateUserInfo={updateUserInfo} />} />
        <Route path="/post/:id" element={<PostDetail userInfo={currentUser} isAuthenticated={isAuthenticated} />} />
        {/* 默认重定向到Home页面（feed流） */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;