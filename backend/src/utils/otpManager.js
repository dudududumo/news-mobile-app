// 内存存储：生产环境请换成 Redis
const otpStore = new Map();
// 结构: phone -> { code, expiresAt, attempts, lockedUntil, lastRequestTime }

const OTP_VALID_DURATION = 5 * 60 * 1000; // 5分钟有效
const LOCK_DURATION = 10 * 60 * 1000;     // 10分钟锁定
const MAX_ATTEMPTS = 5;                   // 最大尝试次数

module.exports = {
  // 检查是否允许发送验证码
  canSendOtp: (phone) => {
    const data = otpStore.get(phone);
    if (!data) return { allowed: true };

    const now = Date.now();

    // 检查是否被锁定
    if (data.lockedUntil && now < data.lockedUntil) {
      const waitMin = Math.ceil((data.lockedUntil - now) / 60000);
      return { allowed: false, msg: `操作频繁，请 ${waitMin} 分钟后再试` };
    }

    // 检查发送频率 (1分钟内)
    if (now - data.lastRequestTime < 60 * 1000) {
      return { allowed: false, msg: '发送太频繁，请稍后再试' };
    }

    return { allowed: true };
  },

  // 保存验证码
  saveOtp: (phone, code) => {
    const existing = otpStore.get(phone) || {};
    otpStore.set(phone, {
      ...existing,
      code,
      expiresAt: Date.now() + OTP_VALID_DURATION,
      lastRequestTime: Date.now(),
      attempts: 0, // 重置尝试次数
      lockedUntil: null // 解除锁定
    });
  },

  // 验证验证码
  verifyOtp: (phone, inputCode) => {
    const data = otpStore.get(phone);
    const now = Date.now();

    if (!data) return { valid: false, msg: '请先获取验证码' };

    // 检查锁定
    if (data.lockedUntil && now < data.lockedUntil) {
      return { valid: false, msg: '账号已锁定，请稍后再试' };
    }

    // 检查过期
    if (now > data.expiresAt) {
      return { valid: false, msg: '验证码已过期' };
    }

    // 校验内容
    if (String(data.code) !== String(inputCode)) {
      data.attempts = (data.attempts || 0) + 1;

      // 触发锁定策略
      if (data.attempts >= MAX_ATTEMPTS) {
        data.lockedUntil = now + LOCK_DURATION;
        return { valid: false, msg: `错误次数过多，已锁定 10 分钟` };
      }

      return { valid: false, msg: `验证码错误，还剩 ${MAX_ATTEMPTS - data.attempts} 次机会` };
    }

    // 验证通过，清除验证码防止二次使用
    otpStore.delete(phone);
    return { valid: true };
  }
};
