/**
 * 工具函数格式化器
 * @file src/utils/formatters.js
 * @description 提供时间格式化和富文本样式等通用工具函数
 */

/**
 * 获取富文本内容的样式配置
 * @description 用于富文本编辑器和展示的样式定义，主要用于内联样式或复杂渲染场景
 * @returns {Object} 富文本元素的样式配置对象
 */
export const getRichTextStyles = () => {
  return {
    p: {
      marginBottom: '16px',
      lineHeight: '1.8',
      fontSize: '16px',
    },
    h1: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '16px',
      marginTop: '24px',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '12px',
      marginTop: '20px',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '10px',
      marginTop: '16px',
    },
    img: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '8px',
      marginVertical: '16px',
    },
    blockquote: {
      borderLeft: '4px solid var(--c-terra, #A04030)',
      paddingLeft: '16px',
      color: '#666',
      fontStyle: 'italic',
      margin: '16px 0',
      backgroundColor: '#fbfbfb',
    },
    ul: {
      marginBottom: '16px',
      paddingLeft: '24px',
    },
    ol: {
      marginBottom: '16px',
      paddingLeft: '24px',
    },
    li: {
      marginBottom: '8px',
      lineHeight: '1.6',
    },
    a: {
      color: 'var(--c-terra, #A04030)',
      textDecoration: 'none',
    },
    strong: {
      fontWeight: 'bold',
    },
    em: {
      fontStyle: 'italic',
    },
  };
};

/**
 * 时间格式化函数（已被dayjs替代）
 * @description 为保持文件结构一致性而保留的占位函数，实际应用中请使用dayjs
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的时间提示
 * @deprecated 已被dayjs库替代，建议使用dayjs进行时间格式化
 */
export const formatTime = (dateString) => {
  // 保持一个与dayjs不冲突的占位实现，确保文件可以导入
  return '时间格式化功能已被dayjs取代';
};

/**
 * 格式化时间的原生实现（备用方案）
 * @description 如果环境不支持dayjs，可以使用此原生JavaScript实现
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的相对时间
 * @private 仅作为备用实现，项目中推荐使用dayjs
 */
/*
const nativeFormatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  // ... (original implementation)
  return '刚刚';
};
*/