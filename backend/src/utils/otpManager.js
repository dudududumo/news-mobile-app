// 导入数据库模型，使用MongoDB存储OTP信息，确保锁定状态持久化
const mongoose = require('mongoose');

// 创建OTP记录的Schema
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Number, required: true }, // 时间戳
  attempts: { type: Number, default: 0 },
  lockedUntil: { type: Number, default: null }, // 锁定时间戳
  lastRequestTime: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 设置集合名称并获取模型
const OtpRecord = mongoose.model('OtpRecord', otpSchema, 'otp_records');

// 自动清理过期记录的辅助函数
async function cleanExpiredRecords() {
  try {
    const now = Date.now();
    await OtpRecord.deleteMany({
      $and: [
        { expiresAt: { $lt: now } }, // 已过期
        { lockedUntil: { $lt: now } } // 锁定也已过期
      ]
    });
  } catch (error) {
    console.error('[OTP调试] 清理过期记录失败:', error);
  }
}

// 定期清理过期记录（每30分钟）
setInterval(cleanExpiredRecords, 30 * 60 * 1000);
// 立即执行一次清理
cleanExpiredRecords();

// 添加调试辅助函数
async function logStoreState(phone, action) {
  try {
    if (phone) {
      const record = await OtpRecord.findOne({ phone }).lean();
      console.log(`[OTP调试] ${action} - 手机号: ${phone}, 当前存储:`, record || {});
    } else {
      const count = await OtpRecord.countDocuments();
      console.log(`[OTP调试] ${action} - 存储大小: ${count}`);
    }
  } catch (error) {
    console.error(`[OTP调试] 记录日志失败:`, error);
  }
}

const OTP_VALID_DURATION = 5 * 60 * 1000; // 5分钟有效
const LOCK_DURATION = 10 * 60 * 1000;     // 10分钟锁定
const MAX_ATTEMPTS = 5;                   // 最大尝试次数

module.exports = {
  // 检查是否允许发送验证码
  canSendOtp: async (phone) => {
    await logStoreState(phone, '检查是否允许发送验证码');
    const now = Date.now();

    try {
      // 从数据库查询记录
      const record = await OtpRecord.findOne({ phone });

      if (!record) {
        console.log(`[OTP调试] 手机号 ${phone} 无记录，允许发送`);
        return { allowed: true };
      }

      console.log(`[OTP调试] 手机号 ${phone} 有记录，尝试次数: ${record.attempts || 0}, 锁定状态: ${record.lockedUntil ? new Date(record.lockedUntil).toLocaleString() : '未锁定'}`);

      // 检查是否被锁定
      if (record.lockedUntil && now < record.lockedUntil) {
        const waitMin = Math.ceil((record.lockedUntil - now) / 60000);
        console.log(`[OTP调试] 手机号 ${phone} 处于锁定状态，还需等待 ${waitMin} 分钟`);
        return { allowed: false, msg: `操作频繁，请 ${waitMin} 分钟后再试` };
      }

      // 检查发送频率 (1分钟内)
      if (now - record.lastRequestTime < 60 * 1000) {
        const waitSec = Math.ceil((record.lastRequestTime + 60000 - now) / 1000);
        console.log(`[OTP调试] 手机号 ${phone} 发送过于频繁，还需等待 ${waitSec} 秒`);
        return { allowed: false, msg: `发送太频繁，请稍后再试` };
      }

      console.log(`[OTP调试] 手机号 ${phone} 允许发送验证码`);
      return { allowed: true };
    } catch (error) {
      console.error(`[OTP调试] 检查发送权限失败:`, error);
      return { allowed: true }; // 出错时默认允许发送
    }
  },

  // 保存验证码
  saveOtp: async (phone, code) => {
    console.log(`[OTP调试] 保存验证码 ${code} 到手机号 ${phone}`);
    const now = Date.now();

    try {
      // 使用upsert操作：存在则更新，不存在则创建
      const newData = {
        code,
        expiresAt: now + OTP_VALID_DURATION,
        lastRequestTime: now,
        attempts: 0, // 重置尝试次数
        lockedUntil: null, // 解除锁定
        updatedAt: new Date()
      };

      // 更新或创建记录
      const result = await OtpRecord.findOneAndUpdate(
        { phone },
        newData,
        { upsert: true, new: true }
      );

      console.log(`[OTP调试] 验证码保存成功，数据:`, result.toObject());
      await logStoreState(phone, '保存验证码后');
    } catch (error) {
      console.error(`[OTP调试] 保存验证码失败:`, error);
    }
  },

  // 验证验证码
  verifyOtp: async (phone, inputCode) => {
    console.log(`[OTP调试] 验证手机号 ${phone} 的验证码 ${inputCode}`);
    await logStoreState(phone, '验证前');

    const now = Date.now();

    try {
      // 从数据库查询记录
      const record = await OtpRecord.findOne({ phone });

      if (!record) {
        console.log(`[OTP调试] 手机号 ${phone} 无验证码记录`);
        return { valid: false, msg: '请先获取验证码' };
      }

      // 检查锁定
      if (record.lockedUntil && now < record.lockedUntil) {
        const waitMin = Math.ceil((record.lockedUntil - now) / 60000);
        console.log(`[OTP调试] 手机号 ${phone} 已锁定，还需等待 ${waitMin} 分钟`);
        return { valid: false, msg: '账号已锁定，请稍后再试' };
      }

      // 检查过期
      if (now > record.expiresAt) {
        console.log(`[OTP调试] 手机号 ${phone} 的验证码已过期`);
        return { valid: false, msg: '验证码已过期' };
      }

      // 校验内容
      if (String(record.code) !== String(inputCode)) {
        console.log(`[OTP调试] 验证码错误，正确值: ${record.code}, 输入值: ${inputCode}`);
        record.attempts = (record.attempts || 0) + 1;
        console.log(`[OTP调试] 当前尝试次数: ${record.attempts}`);

        // 触发锁定策略
        if (record.attempts >= MAX_ATTEMPTS) {
          record.lockedUntil = now + LOCK_DURATION;
          console.log(`[OTP调试] 达到最大尝试次数，已锁定 ${phone}，锁定时间: ${new Date(record.lockedUntil).toLocaleString()}, 锁定时间戳: ${record.lockedUntil}`);
        }

        // 保存更新后的状态（包含尝试次数和可能的锁定状态）
        await record.save();
        console.log(`[OTP调试] 尝试次数和锁定状态已保存到数据库`);

        // 如果已锁定，直接返回锁定消息
        if (record.lockedUntil) {
          return { valid: false, msg: `错误次数过多，已锁定 10 分钟` };
        }

        const remainingAttempts = MAX_ATTEMPTS - record.attempts;
        console.log(`[OTP调试] 剩余尝试次数: ${remainingAttempts}`);
        return { valid: false, msg: `验证码错误，还剩 ${remainingAttempts} 次机会` };
      }

      console.log(`[OTP调试] 验证码验证成功`);
      // 验证通过，清除验证码防止二次使用
      await OtpRecord.deleteOne({ phone });
      console.log(`[OTP调试] 验证成功后已从数据库删除记录`);
      await logStoreState(phone, '验证成功后');
      return { valid: true };
    } catch (error) {
      console.error(`[OTP调试] 验证验证码失败:`, error);
      return { valid: false, msg: '验证服务出错' };
    }
  }
};
