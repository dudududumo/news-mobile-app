import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { NavBar, ImageUploader, Toast, Dialog, SpinLoading, Input } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import service from '../services/axios';

// --- 样式定义 ---
const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--c-bg)',
    paddingBottom: '40px',
  },
  navBar: {
    //background: 'rgba(239, 235, 233, 0.9)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  paperCard: {
    background: '#fff',
    margin: '16px',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(160, 64, 48, 0.05)',
  },
  // 霸气标题区域
  titleWrapper: {
    marginBottom: '24px',
    borderBottom: '2px solid #F5F5F5',
    paddingBottom: '16px',
  },
  statusBar: {
    padding: '0 20px 10px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'right',
    fontFamily: 'var(--font-sans)',
  },
  editorWrapper: {
    minHeight: '250px',
    fontFamily: 'var(--font-sans)',
  },
  aiSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px dashed #E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  aiBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'var(--c-terra)',
    background: 'transparent',
    border: '1px solid var(--c-terra)',
    borderRadius: '20px',
    padding: '6px 16px',
    width: 'fit-content',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  tagsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagItem: {
    background: '#FDF6F5',
    color: 'var(--c-text)',
    border: '1px solid rgba(160, 64, 48, 0.1)',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  publishBtn: {
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 16px',
    borderRadius: '20px',
    background: 'var(--c-terra)',
    border: 'none',
    color: '#fff',
  }
};

// --- Quill 配置 ---
const quillModules = {
  toolbar: [
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileList, setFileList] = useState([]);
  const [tags, setTags] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isRestoring = useRef(false);

  // --- 获取当前用户的专属草稿 Key ---
  const getDraftKey = () => {
    try {
      const userStr = localStorage.getItem('userInfo');
      if (userStr) {
        const user = JSON.parse(userStr);
        const uid = user.id || user._id || user.phone || 'guest';
        return `post_draft_${uid}`;
      }
    } catch (e) {
      console.error('读取用户信息失败', e);
    }
    return 'post_draft_guest';
  };

  // 1. 汉化工具栏提示
  useEffect(() => {
    setTimeout(() => {
      const tooltipMap = {
        '.ql-bold': '加粗',
        '.ql-italic': '斜体',
        '.ql-underline': '下划线',
        '.ql-strike': '删除线',
        '.ql-list[value="ordered"]': '数字列表',
        '.ql-list[value="bullet"]': '符号列表',
        '.ql-blockquote': '引用样式',
        '.ql-link': '插入链接',
        '.ql-clean': '清除格式/背景透明',
        '.ql-size': '字号大小',
        '.ql-color': '文字颜色',
        '.ql-background': '背景颜色',
        '.ql-align': '对齐方式'
      };
      Object.keys(tooltipMap).forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.setAttribute('title', tooltipMap[selector]));
      });
    }, 1000);
  }, []);

  // 2. 恢复草稿
  useEffect(() => {
    const key = getDraftKey();
    const draft = localStorage.getItem(key);

    if (draft) {
      Dialog.confirm({
        title: '恢复编辑',
        content: '发现未发布的草稿，是否继续编辑？',
        onConfirm: () => {
          try {
            const data = JSON.parse(draft);
            isRestoring.current = true;
            setTitle(data.title || '');
            setContent(data.content || '');
            setTags(data.tags || []);
            setFileList(data.fileList || []);
            Toast.show('草稿已恢复');
            setTimeout(() => { isRestoring.current = false; }, 1000);
          } catch (e) { console.error(e); }
        },
        onCancel: () => localStorage.removeItem(key),
      });
    }
  }, []);

  // 3. 自动保存
  useEffect(() => {
    if (isRestoring.current || (!title && !content && fileList.length === 0)) return;
    const timer = setTimeout(() => {
      const key = getDraftKey();
      const draftData = { title, content, tags, fileList, updatedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, tags, fileList]);

  // 图片上传
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await service.post('/posts/upload', formData);
      const data = res.data || res;
      if (data.urls && data.urls.length > 0) {
        let fullUrl = data.urls[0];
        if (!fullUrl.startsWith('http')) fullUrl = `http://localhost:3000${fullUrl}`;
        return { url: fullUrl };
      }
      throw new Error('上传失败');
    } catch (e) {
      Toast.show('图片上传失败');
      throw e;
    }
  };

  // AI 生成标签
  const handleAiLabel = async () => {
    const fullText = `${title}\n${content.replace(/<[^>]+>/g, '')}`.trim();
    if (fullText.length < 2) return Toast.show('请写点标题或内容再试');

    setIsAiLoading(true);
    try {
      const res = await service.post('/posts/ai-label', { content: fullText });
      if (res.tags && res.tags.length > 0) {
        setTags(res.tags);
        Toast.show({ content: '✨ 灵感已捕获', icon: 'success' });
      } else {
        Toast.show('AI 没找到合适的标签');
      }
    } catch (e) {
      // error handled by interceptor
    } finally {
      setIsAiLoading(false);
    }
  };

  // 发布
  const handleSubmit = async () => {
    if (!content && fileList.length === 0) return Toast.show('内容不能为空');

    let finalTitle = title;
    if (!finalTitle) {
      const plainText = content.replace(/<[^>]+>/g, '').trim();
      finalTitle = plainText.slice(0, 20) || '无标题';
    }

    try {
      const imageUrls = fileList.map(item => item.url).filter(Boolean);
      await service.post('/posts', {
        title: finalTitle,
        content,
        images: imageUrls,
        tags,
        status: 'published'
      });
      Toast.show({ content: '发布成功', icon: 'success' });
      localStorage.removeItem(getDraftKey());
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={styles.container}>
      <NavBar
        style={styles.navBar}
        onBack={() => navigate(-1)}
        right={<button style={styles.publishBtn} onClick={handleSubmit}>发布</button>}
      >
        <span style={{ fontWeight: 'bold', color: 'var(--c-text)' }}>撰写新篇</span>
      </NavBar>

      <div style={styles.statusBar}>
        {lastSaved ? `草稿已保存 ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
      </div>

      <div style={styles.paperCard}>

        {/* 霸气标题输入框 */}
        <div className="title-wrapper" style={styles.titleWrapper}>
          <Input
            className="title-input"
            placeholder="请输入标题"
            value={title}
            onChange={setTitle}
            style={{
              '--font-size': '30px',
              '--color': '#1a1a1a',
              padding: '4px 0',
              // 注意：这里的 fontWeight 对 placeholder 不生效，需要下面的 style 标签配合
              fontWeight: '900',
              fontFamily: 'var(--font-serif)',
            }}
          />
        </div>

        {/* 图片上传 */}
        <div style={{ marginBottom: '20px' }}>
          <ImageUploader
            value={fileList}
            onChange={setFileList}
            upload={uploadImage}
            maxCount={9}
            style={{ '--cell-size': '70px' }}
          />
        </div>

        {/* 富文本编辑器 */}
        <div style={styles.editorWrapper}>
          <style>{`
            /* ==========================================
               核心修复：强制覆盖标题 Placeholder 样式
               ========================================== */
            /* 1. 针对 antd-mobile 内部的 input 元素 */
            .title-wrapper .adm-input-element {
              font-size: 30px !important;
              font-weight: 900 !important;
              font-family: var(--font-serif) !important;
            }

            /* 2. 针对所有浏览器的 placeholder 伪元素 */
            .title-wrapper .adm-input-element::placeholder {
              font-size: 30px !important;
              font-weight: 900 !important;
              color: #e0e0e0 !important;
              opacity: 1; /* Firefox 默认透明度不是1 */
              font-family: var(--font-serif) !important;
            }
            
            /* 兼容 Webkit (Chrome, Safari) */
            .title-wrapper .adm-input-element::-webkit-input-placeholder {
              font-size: 30px !important;
              font-weight: 900 !important;
              color: #e0e0e0 !important;
              font-family: var(--font-serif) !important;
            }
            
            /* ==========================================
               Quill 编辑器样式
               ========================================== */
            .ql-toolbar.ql-snow { 
              border: none !important; 
              border-bottom: 1px dashed #E0E0E0 !important; 
              position: sticky;
              top: 0;
              background: #fff;
              z-index: 10;
              padding: 8px 0;
            }
            .ql-container.ql-snow { border: none !important; }
            
            .ql-editor { 
              padding: 16px 0; 
              font-size: 16px; 
              line-height: 1.7;
              min-height: 200px;
              font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif; 
            }
            
            /* 强制加粗样式 */
            .ql-editor strong { font-weight: 700 !important; color: #000; }
            
            .ql-editor blockquote {
              border-left: 4px solid var(--c-terra);
              background: #FDF6F5;
              color: #666;
              padding: 8px 12px;
              margin: 10px 0;
              border-radius: 0 4px 4px 0;
            }

            /* 字号下拉菜单美化 */
            .ql-snow .ql-picker.ql-size .ql-picker-label::before,
            .ql-snow .ql-picker.ql-size .ql-picker-item::before { content: '默认'; }
            .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
            .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before { content: '小字号'; }
            .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
            .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before { content: '大标题'; font-size: 18px; }
            .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
            .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before { content: '超大'; font-size: 22px; }

            .ql-editor.ql-blank::before { color: #BCAAA4; font-style: normal; }
          `}</style>

          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            placeholder="在此记录当下的生活与灵感..."
          />
        </div>

        {/* AI 区域 */}
        <div style={styles.aiSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>TAGS</span>
            <button
              style={{ ...styles.aiBtn, opacity: isAiLoading ? 0.7 : 1 }}
              onClick={handleAiLabel}
              disabled={isAiLoading}
            >
              <span>{isAiLoading ? '思考中...' : 'AI 智能提取'}</span>
            </button>
          </div>
          <div style={styles.tagsWrapper}>
            {tags.map((tag, i) => (
              <span key={i} style={styles.tagItem}>#{tag}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreatePost;
