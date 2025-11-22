import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import Home from './pages/Home';
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

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Home />} />
        {/* 默认重定向到Home页面（feed流） */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;