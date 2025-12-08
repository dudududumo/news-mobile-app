/**
 * JWT 工具模块
 * 用于生成和验证 JSON Web Token
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT Token
 * @param {Object} payload - Token 负载数据
 * @param {string} payload.userId - 用户 ID
 * @param {Object} options - 可选配置
 * @returns {string} - 生成的 JWT Token
 */
const generateToken = (payload, options = {}) => {
  const tokenOptions = {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    ...options
  };
  
  return jwt.sign(payload, JWT_SECRET, tokenOptions);
};

/**
 * 验证 JWT Token
 * @param {string} token - 要验证的 JWT Token
 * @returns {Object|false} - 验证成功返回解码后的负载，失败返回 false
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('[JWT调试] Token 验证失败:', error);
    return false;
  }
};

/**
 * 解码 JWT Token（不验证签名）
 * @param {string} token - 要解码的 JWT Token
 * @returns {Object|false} - 解码后的负载或 false
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('[JWT调试] Token 解码失败:', error);
    return false;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
