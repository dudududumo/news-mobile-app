// C:\Users\杜姝蒙\news-mobile-app\frontend\src\services\axios.js

import axios from 'axios';
import { Toast } from 'antd-mobile';

// 从Vite环境变量获取后端API地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://news-mobile-app.zeabur.app/api';

const instance = axios.create({
  baseURL: BASE_URL,
  // --- 修改点 2: 延长超时时间 ---
  timeout: 60000,
});

// Token 管理 (保持不变)
const TOKEN_KEY = 'auth_token';
export const getToken = () => {
  const str = localStorage.getItem(TOKEN_KEY);
  return str ? JSON.parse(str) : null;
};
export const setToken = (data) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
};
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// 刷新逻辑变量 (保持不变)
let isRefreshing = false;
let requestsQueue = [];

// 请求拦截器
instance.interceptors.request.use(async (config) => {
  const tokenData = getToken();

  if (tokenData && tokenData.token) {
    config.headers.Authorization = `Bearer ${tokenData.token}`;

    const now = Date.now();
    // 提前 5 分钟 (5 * 60 * 1000) 检测是否需要刷新
    if (tokenData.expiresAt && tokenData.expiresAt - now < 300000 && !config.url.includes('/auth/refresh') && !isRefreshing) {
      isRefreshing = true;
      try {
        const { data } = await instance.post('/auth/refresh', { token: tokenData.token });

        setToken({ token: data.token, expiresAt: data.expiresAt });
        config.headers.Authorization = `Bearer ${data.token}`;

        requestsQueue.forEach(cb => cb(data.token));
        requestsQueue = [];
      } catch (e) {
        console.error('Token refresh failed', e);
        clearToken();
        // 🔴 修复 1: 刷新失败时，避免直接 window.location.href
        // 只清空 Token，App.jsx 在下一次渲染时会发现 Token 缺失，
        // 并在用户尝试需要权限的操作时才引导登录。
        Toast.show('会话过期，请重新登录');
        // 🚨 注意：如果 App.jsx 顶部没有监听 Token 变化来重定向，用户会停留在 Home，直到触发需要权限的操作

      } finally {
        isRefreshing = false;
      }
    }

    if (isRefreshing && !config.url.includes('/auth/refresh')) {
      return new Promise(resolve => {
        requestsQueue.push((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(config);
        });
      });
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 响应拦截器
instance.interceptors.response.use(
  (res) => {
    return res.data;
  },
  (err) => {
    if (err.code === 'ECONNABORTED' && err.message.indexOf('timeout') !== -1) {
      Toast.show('请求超时，请检查网络或稍后重试');
      return Promise.reject(err);
    }

    if (err.response) {
      const { status, data, config } = err.response;
      // 公开路径列表，这些路径即使未登录也允许访问
      const publicPaths = ['/posts', '/post/']; // 🔴 修复 2: 增加 '/post/' 以匹配详情页

      if (status === 401) {
        clearToken();
        // 检查是否是公开路径的请求
        const isPublicPath = publicPaths.some(path => config.url.includes(path));

        // 🔴 修复 3: 优化 401 处理逻辑
        if (!isPublicPath) {
          // 非公开路径（如 /create, 点赞/评论等）
          Toast.show('登录信息已失效，请重新登录');
          setTimeout(() => {
            // 只有非公开路径才强制跳转，因为这些页面/操作必须登录
            window.location.href = '/login';
          }, 1000);
        } else {
          // 公开路径（如 /posts, /post/:id）
          // 仅清除 Token，让组件（Home/PostDetail）的本地逻辑来处理 UI 变化（如隐藏点赞按钮）
          // 避免跳转，允许浏览
          Toast.show('请登录后进行互动');
        }
      } else {
        // 优先显示后端返回的错误信息
        const msg = data.message || data.error || '请求失败';
        Toast.show(msg.length > 50 ? '服务器内部错误' : msg);
      }
    } else {
      Toast.show('网络连接异常');
    }
    return Promise.reject(err);
  }
);

export default instance;