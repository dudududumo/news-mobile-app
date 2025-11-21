import axios from 'axios';
import { Toast } from 'antd-mobile';

// 环境变量
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Token 管理
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
  // window.location.href = '/login'; // 根据路由情况放开
};

// 刷新逻辑
let isRefreshing = false;
let requestsQueue = [];

// 请求拦截
instance.interceptors.request.use(async (config) => {
  const tokenData = getToken();

  if (tokenData && tokenData.token) {
    config.headers.Authorization = `Bearer ${tokenData.token}`;

    const now = Date.now();
    // 提前 5 分钟 (5 * 60 * 1000) 刷新
    if (tokenData.expiresAt && tokenData.expiresAt - now < 300000 && !config.url.includes('/refresh') && !isRefreshing) {
      isRefreshing = true;
      try {
        const { data } = await instance.post('/auth/refresh', { token: tokenData.token });
        setToken({ token: data.token, expiresAt: data.expiresAt });
        config.headers.Authorization = `Bearer ${data.token}`;

        // 重试队列
        requestsQueue.forEach(cb => cb(data.token));
        requestsQueue = [];
      } catch (e) {
        console.error('Token refresh failed', e);
        clearToken();
      } finally {
        isRefreshing = false;
      }
    }

    // 如果正在刷新，挂起当前请求
    if (isRefreshing && !config.url.includes('/refresh')) {
      return new Promise(resolve => {
        requestsQueue.push((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(config);
        });
      });
    }
  }
  return config;
});

// 响应拦截
instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response) {
      const { status, data } = err.response;
      if (status === 401) {
        clearToken();
        Toast.show('登录已过期');
      } else {
        Toast.show(data.message || '网络错误');
      }
    }
    return Promise.reject(err);
  }
);

export default instance;
