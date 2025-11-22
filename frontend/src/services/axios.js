import axios from 'axios';
import { Toast } from 'antd-mobile';

// --- 修改点 1: 明确后端地址 ---
// 如果你配置了 vite proxy，可以用 '/api'。
// 但为了排除干扰，建议直接指向后端 http://localhost:3000/api
const BASE_URL = 'http://localhost:3000/api';

const instance = axios.create({
  baseURL: BASE_URL,
  // --- 修改点 2: 延长超时时间 ---
  // 从 10000 改为 60000 (1分钟)。
  // AI 生成通常需要 10-20秒，大图片上传也需要时间，10秒太短了。
  timeout: 60000,
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
};

// 刷新逻辑变量
let isRefreshing = false;
let requestsQueue = [];

// 请求拦截器
instance.interceptors.request.use(async (config) => {
  const tokenData = getToken();

  if (tokenData && tokenData.token) {
    // 自动添加 Token
    config.headers.Authorization = `Bearer ${tokenData.token}`;

    const now = Date.now();
    // 提前 5 分钟 (5 * 60 * 1000) 检测是否需要刷新
    // 且当前请求不是刷新接口本身
    if (tokenData.expiresAt && tokenData.expiresAt - now < 300000 && !config.url.includes('/auth/refresh') && !isRefreshing) {
      isRefreshing = true;
      try {
        // 发起刷新请求
        // 注意：这里使用 axios 原始实例或者 instance 都可以，但要避免死循环
        // 这里复用 instance，但上面有个 !config.url.includes 判定防止死循环
        const { data } = await instance.post('/auth/refresh', { token: tokenData.token });

        // 更新本地 Token
        setToken({ token: data.token, expiresAt: data.expiresAt });
        config.headers.Authorization = `Bearer ${data.token}`;

        // 执行队列中的请求
        requestsQueue.forEach(cb => cb(data.token));
        requestsQueue = [];
      } catch (e) {
        console.error('Token refresh failed', e);
        clearToken();
        window.location.href = '/login'; // 刷新失败回登录页
      } finally {
        isRefreshing = false;
      }
    }

    // 如果正在刷新中，将当前请求挂起放入队列
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
    // 直接返回 data 部分，方便前端使用
    return res.data;
  },
  (err) => {
    // 这里的 err 可能是超时，也可能是后端报错
    if (err.code === 'ECONNABORTED' && err.message.indexOf('timeout') !== -1) {
      Toast.show('请求超时，请检查网络或稍后重试');
      return Promise.reject(err);
    }

    if (err.response) {
      const { status, data } = err.response;
      if (status === 401) {
        clearToken();
        Toast.show('登录已过期，请重新登录');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        // 优先显示后端返回的错误信息
        const msg = data.message || data.error || '请求失败';
        // 避免显示过长的报错
        Toast.show(msg.length > 50 ? '服务器内部错误' : msg);
      }
    } else {
      Toast.show('网络连接异常');
    }
    return Promise.reject(err);
  }
);

export default instance;
