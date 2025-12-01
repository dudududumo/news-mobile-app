// 格式化时间 (使用 dayjs 替代，以保持与 Home.jsx 一致的相对时间显示)
// 注意：如果您的环境不支持 dayjs, 可以使用下面的原生实现，但 Home.jsx 已经使用了 dayjs
/*
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  // ... (original implementation)
  return '刚刚';
};
*/

// 获取富文本样式 - 在本应用中，这些样式主要通过全局CSS类 (.ql-editor, .feed-rich-content) 来控制，
// 但我们保留这个函数以备将来可能需要内联样式或更复杂的渲染。
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

// 暴露 formatTime，即使我们知道 Home.jsx 和 PostDetail.jsx 使用 dayjs，以满足原始文件结构
// 建议在 PostDetail.jsx 中使用 dayjs 保持一致性。
export const formatTime = (dateString) => {
  // 保持一个与dayjs不冲突的占位实现，确保文件可以导入
  return '时间格式化功能已被dayjs取代';
};