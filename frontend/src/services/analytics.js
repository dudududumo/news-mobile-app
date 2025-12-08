/**
 * 数据分析服务
 * @file src/services/analytics.js
 * @description 提供用户行为埋点和数据分析功能，支持批量发送和定时上传
 */

import service from './axios';

/**
 * 数据分析服务类
 * 用于追踪用户行为，支持批量发送和定时上传
 */
class AnalyticsService {
  /**
   * 构造函数
   */
  constructor() {
    this.queue = []; // 事件缓存队列
    this.batchSize = 10; // 批量发送阈值
    this.flushInterval = 5000; // 定时发送间隔(ms)
    this.timer = null;

    // 启动定时器
    this.startTimer();
  }

  /**
   * 启动定时发送定时器
   */
  startTimer() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * 核心方法：记录用户行为事件
   * @param {string} eventName - 事件名称
   * @param {Object} [data={}] - 事件附加数据
   */
  track(eventName, data = {}) {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      url: window.location.pathname,
      ...data
      // 可以附加更多公共字段，如 device_id, app_version 等
    };

    console.log(`[Analytics] Track: ${eventName}`, event);
    this.queue.push(event);

    // 如果队列满了，立即发送
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * 将缓存的事件数据发送到后端
   */
  async flush() {
    if (this.queue.length === 0) return;

    const payload = [...this.queue];
    this.queue = []; // 清空队列

    try {
      // 发送事件数据到后端
      await service.post('/analytics/batch', { events: payload });
      console.log(`[Analytics] Flushed ${payload.length} events`);
    } catch (error) {
      console.error('[Analytics] Upload failed', error);
      // 发送失败可以选择重新放回队列，这里简化处理先忽略
    }
  }
}

// 创建并导出单例实例
const analytics = new AnalyticsService();
export default analytics;
