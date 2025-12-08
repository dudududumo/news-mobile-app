import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { NavBar, ImageUploader, Toast, Dialog, SpinLoading, Input, Modal } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { CompassOutline } from 'antd-mobile-icons';
import service from '../services/axios';

// --- 样式定义 ---
const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--c-bg)',
    paddingBottom: '40px',
  },
  navBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    borderBottom: '1px solid #f5f5f5',
  },
  navContent: {
    width: '100%',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navLogo: {
    fontFamily: '"Playfair Display",serif',
    fontSize: '24px',
    fontWeight: '700',
    color: '#000',
    letterSpacing: '-0.5px',
    flex: 1,
    textAlign: 'center'
  },
  backButton: {
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
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

  // 发布按钮样式
  publishBtn: {
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 16px',
    borderRadius: '20px',
    background: 'var(--c-terra)',
    border: 'none',
    color: '#fff',
  },
  // 自动保存提示样式
  autoSaveHint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '16px',
    textAlign: 'center',
    paddingBottom: '20px',
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
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileList, setFileList] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isRestoring = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const cloudSyncFailed = useRef(false);

  // 编辑模式相关状态
  const isEditMode = location.state?.isEdit || false;
  const editingPost = location.state?.post || null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载编辑数据
  useEffect(() => {
    if (isEditMode && editingPost) {
      // 延迟一下确保组件完全挂载
      setTimeout(() => {
        setTitle(editingPost.title || '');
        setContent(editingPost.content || '');

        // 转换图片数据格式
        if (editingPost.images && editingPost.images.length > 0) {
          const formattedImages = editingPost.images.map(url => ({
            url,
            status: 'done'
          }));
          setFileList(formattedImages);
        }
      }, 100);
    }
  }, [isEditMode, editingPost]);



  // --- 获取当前用户的专属草稿 Key ---
  const getDraftKey = () => {
    try {
      const userStr = localStorage.getItem('userInfo');
      if (userStr) {
        const user = JSON.parse(userStr);
        const uid = user.id || user._id || user.phone || 'guest';
        if (isEditMode && editingPost) {
          return `post_draft_${uid}_edit_${editingPost._id}`;
        }
        return `post_draft_${uid}`;
      }
    } catch (e) {
      console.error('读取用户信息失败', e);
    }
    if (isEditMode && editingPost) {
      return `post_draft_guest_edit_${editingPost._id}`;
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

  // 显示主题化弹窗（与Home页面一致的样式）
  const showThemeModal = (title, content, onConfirm, confirmText = '确定', onCancel) => {
    const modal = Modal.show({
      content: (
        <div className="login-modal">
          <h3 className="login-modal-title">{title}</h3>
          <div className="login-modal-content">
            {content}
          </div>
          <div className="login-modal-button-group">
            <button
              className="login-modal-button login-modal-cancel"
              onClick={() => {
                modal.close();
                if (onCancel) onCancel();
              }}
            >
              取消
            </button>
            <button
              className="login-modal-button login-modal-confirm"
              onClick={() => {
                modal.close();
                if (onConfirm) onConfirm();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      closeOnMaskClick: true,
      modalClassName: 'custom-modal-reset',
      bodyStyle: {
        padding: 0,
        backgroundColor: 'transparent',
        width: '100%'
      }
    });
  };

  // 恢复草稿
  useEffect(() => {
    const key = getDraftKey();
    const draft = localStorage.getItem(key);

    if (draft) {
      showThemeModal(
        '恢复编辑',
        '发现未发布的草稿，是否继续编辑？',
        () => {
          try {
            const data = JSON.parse(draft);
            isRestoring.current = true;
            setTitle(data.title || '');
            setContent(data.content || '');
            setFileList(data.fileList || []);
            Toast.show('草稿已恢复');
            setTimeout(() => { isRestoring.current = false; }, 1000);
          } catch (e) { console.error(e); }
        },
        '继续编辑',
        () => localStorage.removeItem(key)
      );
    }
  }, []);

  // 3. 30秒自动云端保存
  useEffect(() => {
    if (isRestoring.current || (!title && !content && fileList.length === 0)) return;

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      // 保存到本地存储
      const key = getDraftKey();
      const draftData = { title, content, fileList, updatedAt: Date.now(), cloudSyncFailed: cloudSyncFailed.current };
      localStorage.setItem(key, JSON.stringify(draftData));
      setLastSaved(new Date());

      // 如果在线，尝试云端保存
      if (isOnline) {
        try {
          const cloudData = {
            title, content,
            images: fileList.map(item => item.url).filter(Boolean),
            updatedAt: Date.now()
          };
          await service.post('/posts/draft', cloudData);
          cloudSyncFailed.current = false;
        } catch (error) {
          console.error('云端自动保存失败:', error);
          cloudSyncFailed.current = true;
        }
      } else {
        cloudSyncFailed.current = true;
      }
    }, 30000); // 30秒自动保存

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, tags, fileList, isOnline]);

  // 4. 监听网络状态变化
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // 恢复网络后，自动同步未保存的草稿
      if (cloudSyncFailed.current) {
        try {
          const key = getDraftKey();
          const localDraft = JSON.parse(localStorage.getItem(key));
          if (localDraft) {
            const cloudData = {
              title: localDraft.title || title,
              content: localDraft.content || content,
              images: (localDraft.fileList || fileList).map(item => item.url).filter(Boolean),
              updatedAt: Date.now()
            };
            await service.post('/posts/draft', cloudData);
            cloudSyncFailed.current = false;
            setLastSaved(new Date());
            Toast.show('草稿已同步到云端');
          }
        } catch (error) {
          console.error('网络恢复后同步失败:', error);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      Toast.show('网络已断开，将在本地保存草稿');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [title, content, tags, fileList]);

  // 5. 退出时保存到云端
  const handleExit = () => {
    // 保存到本地存储
    const key = getDraftKey();
    const draftData = { title, content, tags, fileList, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(draftData));

    // 如果在线，尝试云端保存（异步执行，不等待结果）
    if (isOnline) {
      // 使用try-catch包裹，避免控制台显示错误信息
      service.post('/posts/draft', {
        title, content, tags,
        images: fileList.map(item => item.url).filter(Boolean),
        updatedAt: Date.now()
      }).then(() => {
        cloudSyncFailed.current = false;
      }).catch(() => {
        // 不显示错误信息，只更新状态
        cloudSyncFailed.current = true;
      });
    } else {
      cloudSyncFailed.current = true;
    }

    // 直接返回，不添加延迟
    navigate(-1);
  };

  // 图片上传
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);

    try {
      const res = await service.post('/posts/upload', formData);
      const data = res.data || res;

      if (data.urls && data.urls.length > 0) {
        return { url: data.urls[0] }; // COS 返回的 URL 已经完整
      }
      throw new Error('上传失败');
    } catch (e) {
      Toast.show('图片上传失败');
      throw e;
    }
  };







  // 发布或更新帖子
  const handleSubmit = async () => {
    if (!content && fileList.length === 0) return Toast.show('内容不能为空');

    let finalTitle = title;
    if (!finalTitle) {
      const plainText = content.replace(/<[^>]+>/g, '').trim();
      finalTitle = plainText.slice(0, 20) || '无标题';
    }

    setIsSubmitting(true);
    try {
      const imageUrls = fileList.map(item => item.url).filter(Boolean);
      const postData = {
        title: finalTitle,
        content,
        images: imageUrls,
        status: 'published'
      };

      if (isEditMode && editingPost) {
        // 编辑模式：使用PUT请求更新帖子
        await service.put(`/posts/${editingPost._id}`, postData);
        Toast.show({ content: '修改保存成功', icon: 'success' });
        localStorage.removeItem(getDraftKey()); // 编辑模式也清除草稿
      } else {
        // 创建模式：使用POST请求创建新帖子
        await service.post('/posts', postData);
        Toast.show({ content: '发布成功', icon: 'success' });
        localStorage.removeItem(getDraftKey());
      }

      // 直接返回到首页或帖子详情页，不添加延迟
      navigate(isEditMode ? '/post/' + editingPost._id : '/');
    } catch (e) {
      console.error(e);
      Toast.show({
        content: isEditMode ? '保存失败，请重试' : '发布失败，请重试',
        icon: 'fail'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 自定义导航栏 - 与PostDetail保持一致 */}
      <div style={styles.navBar}>
        <div style={styles.navContent}>
          <div onClick={handleExit} style={styles.backButton}>
            &lt;
          </div>
          <div style={styles.navLogo}>City Daily.</div>
          <div style={{ width: '24px' }} /> {/* 占位元素，保持logo居中 */}
        </div>
      </div>

      {/* 为固定导航栏留出空间 */}
      <div style={{ height: '56px' }}></div>

      {/* 标题和发布按钮区域 */}
      <div style={{
        padding: '0 16px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f5f5f5'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--c-text)' }}>
          {isEditMode ? '编辑帖子' : '撰写新篇'}
        </span>

        {/* 发布按钮 */}
        <button
          style={{
            ...styles.publishBtn,
            opacity: isSubmitting ? 0.7 : 1,
            pointerEvents: isSubmitting ? 'none' : 'auto'
          }}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >{isSubmitting ? '提交中...' : (isEditMode ? '保存修改' : '发布')}</button>
      </div>

      <div style={styles.statusBar}>
        {isEditMode && editingPost ? (
          <div style={{ fontSize: '13px', color: '#666' }}>
            发布于 {new Date(editingPost.createdAt).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            })}
            {editingPost.updatedAt && editingPost.updatedAt !== editingPost.createdAt && (
              <span style={{ marginLeft: '10px' }}>
                编辑于 {new Date(editingPost.updatedAt).toLocaleString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
          </div>
        ) : (
          lastSaved ? `草稿已保存 ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
        )}
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
            placeholder="在此记录生活与灵感..."
          />
        </div>



      </div>
    </div>
  );
};

export default CreatePost;
