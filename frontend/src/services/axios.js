/**
 * HTTP请求服务配置
 * @file src/services/axios.js
 * @description 封装Axios请求实例，处理请求/响应拦截、Token管理和错误处理
 */

import axios from 'axios';
import { Toast } from 'antd-mobile';

/**
 * 后端API基础地址
 * 从Vite环境变量获取，默认使用Zeabur部署的API地址
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://news-mobile-app.zeabur.app/api';

/**
 * 创建Axios实例
 * @type {import('axios').AxiosInstance}
 */
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 延长超时时间至60秒
});

/**
 * Token 管理模块
 */

/**
 * Token存储键名
 */
const TOKEN_KEY = 'auth_token';

/**
 * 获取存储的Token信息
 * @returns {Object|null} Token信息对象或null
 */
export const getToken = () => {
  const str = localStorage.getItem(TOKEN_KEY);
  return str ? JSON.parse(str) : null;
};

/**
 * 设置Token信息到本地存储
 * @param {Object} data - Token信息对象
 * @param {string} data.token - 访问令牌
 * @param {number} data.expiresAt - 令牌过期时间戳
 */
export const setToken = (data) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
};

/**
 * 清除本地存储的Token信息
 */
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Token刷新相关变量
 */
let isRefreshing = false; // 是否正在刷新Token
let requestsQueue = [];  // 等待Token刷新的请求队列

/**
 * 请求拦截器
 * 处理Token添加、自动刷新等逻辑
 */
instance.interceptors.request.use(
  async (config) => {
    const tokenData = getToken();

    if (tokenData && tokenData.token) {
      // 设置Authorization头
      config.headers.Authorization = `Bearer ${tokenData.token}`;

      const now = Date.now();
      // 提前5分钟检测Token是否需要刷新
      if (
        tokenData.expiresAt && 
        tokenData.expiresAt - now < 300000 && 
        !config.url.includes('/auth/refresh') && 
        !isRefreshing
      ) {
        isRefreshing = true;
        try {
          // 发送Token刷新请求
          const { data } = await instance.post('/auth/refresh', { token: tokenData.token });

          // 更新本地Token
          setToken({ token: data.token, expiresAt: data.expiresAt });
          config.headers.Authorization = `Bearer ${data.token}`;

          // 处理等待中的请求
          requestsQueue.forEach(cb => cb(data.token));
          requestsQueue = [];
        } catch (e) {
          console.error('Token刷新失败:', e);
          clearToken();
          Toast.show('会话过期，请重新登录');
        } finally {
          isRefreshing = false;
        }
      }

      // Token刷新中，将请求加入队列等待
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
  }, 
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 处理响应数据和错误
 */
instance.interceptors.response.use(
  (res) => {
    // 直接返回响应数据
    return res.data;
  },
  (err) => {
    // 处理超时错误
    if (err.code === 'ECONNABORTED' && err.message.indexOf('timeout') !== -1) {
      Toast.show('请求超时，请检查网络或稍后重试');
      return Promise.reject(err);
    }

    // 处理响应错误
    if (err.response) {
      const { status, data, config } = err.response;
      
      // 公开路径列表 - 这些路径无需登录即可访问
      const publicPaths = ['/posts', '/post/'];

      if (status === 401) {
        clearToken();
        // 检查是否是公开路径的请求
        const isPublicPath = publicPaths.some(path => config.url.includes(path));

        if (!isPublicPath) {
          // 非公开路径（如创建、点赞、评论等操作）
          Toast.show('登录信息已失效，请重新登录');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        } else {
          // 公开路径（如帖子列表、详情页）
          // 允许浏览，但提示用户登录后可进行互动
          Toast.show('请登录后进行互动');
        }
      } else {
        // 处理其他HTTP错误
        const msg = data.message || data.error || '请求失败';
        // 过长的错误信息截断显示
        Toast.show(msg.length > 50 ? '服务器内部错误' : msg);
      }
    } else {
      // 网络连接异常
      Toast.show('网络连接异常');
    }
    return Promise.reject(err);
  }
);

export default instance;