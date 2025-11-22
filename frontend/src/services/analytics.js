import service from './axios';

class AnalyticsService {
  constructor() {
    this.queue = []; // 缓存队列
    this.batchSize = 10; // 攒够10条发一次
    this.flushInterval = 5000; // 或者每5秒发一次
    this.timer = null;

    // 启动定时器
    this.startTimer();
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // 核心方法：埋点
  track(eventName, data = {}) {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      url: window.location.pathname,
      ...data,
      // 可以附加更多公共字段，如 device_id, app_version 等
    };

    console.log(`[Analytics] Track: ${eventName}`, event);
    this.queue.push(event);

    // 如果队列满了，立即发送
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  // 发送数据到后端
  async flush() {
    if (this.queue.length === 0) return;

    const payload = [...this.queue];
    this.queue = []; // 清空队列

    try {
      // 这里的接口需要在后端实现
      await service.post('/analytics/batch', { events: payload });
      console.log(`[Analytics] Flushed ${payload.length} events`);
    } catch (error) {
      console.error('[Analytics] Upload failed', error);
      // 发送失败可以选择重新放回队列，这里简化处理先忽略
    }
  }
}

const analytics = new AnalyticsService();
export default analytics;
