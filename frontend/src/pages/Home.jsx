import React, { useState, useEffect, useCallback } from 'react';
import {
  PullToRefresh,
  InfiniteScroll,
  ImageViewer,
  Toast,
  Skeleton,
  Modal
} from 'antd-mobile';
import {
  HeartOutline,
  HeartFill,
  MessageOutline,
  MoreOutline,
  AddCircleOutline,
  UserCircleOutline
} from 'antd-mobile-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import service, { clearToken, getToken } from '../services/axios';
import analytics from '../services/analytics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// --- 引入 Quill 样式 ---
import 'react-quill/dist/quill.snow.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const BRAND_COLOR = '#a04030'; // 陶土色

// --- 样式定义 (完全恢复原状) ---
const styles = {
  page: {
    // background: '#ffffff', // 🔥 修改1：纯白背景，不要灰底
    minHeight: '100vh',
    //paddingTop: '60px',
  },
  navBar: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
    background: 'rgba(255, 255, 255, 0.98)', // 纯白磨砂
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center',
    zIndex: 1000,
    borderBottom: '1px solid #f5f5f5', // 极淡的分割线
  },
  navContent: {
    width: '100%',
    padding: '0 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  navLogo: {
    fontFamily: '"Playfair Display", serif',
    fontSize: '24px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px'
  },
  userArea: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
    borderRadius: '20px', background: '#fff', border: '1px solid #eee', cursor: 'pointer',
  },
  userAvatarSmall: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
  userNameSmall: { fontSize: '13px', color: '#333', fontWeight: '500' },

  // --- 主容器 (恢复原状，保证下拉刷新正常) ---
  mainContainer: {
    width: '100%',
    margin: 0,
    padding: '24px 0 80px 0',
    boxSizing: 'border-box',
  },

  // --- 卡片样式 ---
  card: {
    background: '#fff',
    margin: '16px',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(160, 64, 48, 0.05)',
    textAlign: 'left',
  },

  // 头部用户信息
  header: {
    display: 'flex', alignItems: 'center', marginBottom: '12px',
    justifyContent: 'flex-start' // 确保靠左
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px',
    objectFit: 'cover', border: '1px solid #f5f5f5'
  },
  headerInfo: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start' // 昵称和时间左对齐
  },
  nickname: { fontSize: '15px', fontWeight: '600', color: '#222', lineHeight: '1.2' },
  time: { fontSize: '12px', color: '#999', marginTop: '3px' },


  postTitle: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#111',
    marginBottom: '12px',
    lineHeight: '1.4',
    fontFamily: '"Playfair Display", serif', // 标题用衬线体，优雅
    textAlign: 'left',
  },

  // --- 底部 ---
  footer: {
    display: 'flex', alignItems: 'center', gap: '24px',
    marginTop: '16px', paddingTop: '16px',
    borderTop: '1px solid #f9f9f9'
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '14px', color: '#555',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 0, transition: 'color 0.2s'
  },

  fab: {
    position: 'fixed', bottom: '40px', right: '30px',
    width: '56px', height: '56px',
    borderRadius: '50%',
    background: 'var(--c-terra)', // 陶土色按钮
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 100, cursor: 'pointer'
  },

  expandBtn: {
    color: BRAND_COLOR, fontWeight: '600', cursor: 'pointer', marginTop: '10px', display: 'inline-block', fontSize: '14px'
  }
};

// --- 注入全局 CSS ---
const GlobalStyles = () => (
  <style>{`
    :root { --c-terra: ${BRAND_COLOR}; }
    
    /* 覆盖 antd-mobile pull-to-refresh 背景，使其透明 */
    .adm-pull-to-refresh-head { background: transparent !important; }

    /* 富文本容器 */
    .feed-rich-content {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.75; /* 增加行高 */
      color: #333;
      text-align: left; /* 强制内容左对齐 */
    }

    /* 引用块样式 */
    .feed-rich-content blockquote {
      border-left: 3px solid var(--c-terra);
      background: #fbfbfb;
      color: #666;
      padding: 6px 12px;
      margin: 12px 0;
      border-radius: 0 4px 4px 0;
      font-style: italic;
    }

    .feed-rich-content strong { font-weight: 700 !important; color: #000; }
    
    /* 字号适配 */
    .feed-rich-content .ql-size-small { font-size: 0.85em; color: #666; }
    .feed-rich-content .ql-size-large { font-size: 1.2em; font-weight: 600; margin-top: 10px; display:block; } 
    .feed-rich-content .ql-size-huge { font-size: 1.5em; font-weight: 800; margin-top: 16px; display:block; }
    
    .feed-rich-content ul, .feed-rich-content ol { padding-left: 20px; margin: 8px 0; }
    .feed-rich-content p { margin-bottom: 10px; }
    
    /* 移动端调整 FAB 位置，避免挡住内容 */
    @media (max-width: 768px) {
      .fab-btn { right: 20px !important; bottom: 30px !important; }
     
    }
  `}</style>
);

// --- 图片网格组件 ---
const ImageGrid = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;

  // 单图
  if (count === 1) {
    return (
      <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
        <img src={images[0]} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} alt=""
          onClick={(e) => { e.stopPropagation(); ImageViewer.Multi.show({ images }); }} />
      </div>
    );
  }

  // 多图
  let cols = count === 2 || count === 4 ? '1fr 1fr' : '1fr 1fr 1fr';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', marginTop: '12px' }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ aspectRatio: '1/1', position: 'relative' }}>
          <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', background: '#f8f8f8' }} alt=""
            onClick={(e) => { e.stopPropagation(); ImageViewer.Multi.show({ images, defaultIndex: idx }); }} />
        </div>
      ))}
    </div>
  );
};

// --- 帖子卡片组件 ---
const PostCard = React.memo(({ post, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const isLong = post.content && post.content.length > 200;

  const handleLike = (e) => {
    e.stopPropagation();
    onAction('like', post, (success) => success && setIsLiked(!isLiked));
  };

  return (
    <div style={styles.card}>
      {/* 头部：左对齐 */}
      <div style={styles.header}>
        <img src={post.author?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'} alt="" style={styles.avatar} />
        <div style={styles.headerInfo}>
          <div style={styles.nickname}>{post.author?.nickname || 'City User'}</div>
          <div style={styles.time}>{dayjs(post.createdAt).fromNow()}</div>
        </div>
        <div style={{ flex: 1 }} />
        <MoreOutline fontSize={20} color="#999" onClick={(e) => { e.stopPropagation(); onAction('more', post); }} />
      </div>

      {/* 标题 */}
      {post.title && (
        <div style={styles.postTitle}>
          {post.title}
        </div>
      )}

      {/* 富文本内容 */}
      <div onClick={() => { if (isLong) setIsExpanded(!isExpanded); }}>
        <div
          className="feed-rich-content ql-editor"
          style={{
            padding: 0,
            overflow: 'hidden',
            maxHeight: (!isExpanded && isLong) ? '120px' : 'none',
            maskImage: (!isExpanded && isLong) ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none',
            WebkitMaskImage: (!isExpanded && isLong) ? 'linear-gradient(to bottom, black 60%, transparent 100%)' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {isLong && (
          <div style={styles.expandBtn} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            {isExpanded ? '收起' : '展开全文'}
          </div>
        )}
      </div>

      {/* 图片 */}
      <ImageGrid images={post.images} />

      {/* 标签 */}
      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {post.tags.map((t, i) => (
            <span key={i} style={{ color: '#666', background: '#f5f5f5', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>#{t}</span>
          ))}
        </div>
      )}

      {/* 底部 */}
      <div style={styles.footer}>
        <button style={styles.actionBtn} onClick={handleLike}>
          {isLiked ? <HeartFill style={{ color: BRAND_COLOR, fontSize: 20 }} /> : <HeartOutline style={{ fontSize: 20 }} />}
          <span style={{ color: isLiked ? BRAND_COLOR : '#666', fontWeight: isLiked ? '600' : '400' }}>{isLiked ? '128' : '赞'}</span>
        </button>
        <button style={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onAction('comment', post); }}>
          <MessageOutline style={{ fontSize: 20 }} /> <span>评论</span>
        </button>
      </div>
    </div>
  );
});

// --- 主页面 ---
const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFirstLoading, setIsFirstLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => { analytics.track('page_view', { page_id: 'home_feed' }); }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('userInfo');
    const token = getToken();
    if (userStr && token?.token) setUserInfo(JSON.parse(userStr));
    else setUserInfo(null);
  }, [location]);

  // 🔥🔥🔥 核心修改：统一风格的弹窗逻辑 (包含防止截断的 className) 🔥🔥🔥
  const showThemeModal = (title, content, onConfirm, confirmText = '确定') => {
    const modal = Modal.show({
      content: (
        // login-modal 样式在 index.css 中定义
        <div className="login-modal">
          <h3 className="login-modal-title">{title}</h3>
          <div className="login-modal-content">
            {content}
          </div>
          <div className="login-modal-button-group">
            <button
              className="login-modal-button login-modal-cancel"
              onClick={() => modal.close()}
            >
              取消
            </button>
            <button
              className="login-modal-button login-modal-confirm"
              onClick={() => { modal.close(); onConfirm(); }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      closeOnMaskClick: true,
      // 关键：使用这个 className 配合 index.css 强制去掉 Antd 默认样式，解决截断问题
      modalClassName: 'custom-modal-reset',
      bodyStyle: {
        padding: 0,
        backgroundColor: 'transparent',
        width: '100%'
      }
    });
  };

  const checkLogin = (redirectPath) => {
    const token = getToken();
    if (!token?.token) {
      // 替换为新弹窗
      showThemeModal(
        '需要登录',
        '登录后即可发布内容并与大家互动，是否前往登录？',
        () => navigate(`/login?redirect=${redirectPath}`),
        '去登录'
      );
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    // 替换为新弹窗
    showThemeModal(
      '退出登录',
      '确定要退出当前的账号吗？',
      () => {
        const logoutTime = new Date().toISOString();
        localStorage.setItem('lastLogoutTime', logoutTime);
        clearToken();
        localStorage.removeItem('userInfo');
        setUserInfo(null);
      },
      '确认退出'
    );
  };

  const handleRefresh = async () => {
    setPage(1);
    try {
      const res = await service.get(`/posts?page=1&limit=10`);
      setData(res.list || []);
      setHasMore(res.hasMore);
      setPage(2);
      Toast.show({ content: '已更新', position: 'top' });
    } catch (error) {
      Toast.show('网络错误');
    }
  };

  const loadMore = async () => {
    if (isFirstLoading) return;
    try {
      const res = await service.get(`/posts?page=${page}&limit=10`);
      setData(prev => [...prev, ...(res.list || [])]);
      setHasMore(res.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      setHasMore(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await handleRefresh();
      setIsFirstLoading(false);
    };
    init();
  }, []);

  return (
    <div style={styles.page}>
      <GlobalStyles />

      <div style={styles.navBar}>
        <div style={styles.navContent}>
          <div style={styles.navLogo}>City Daily.</div>
          <div style={styles.userArea} onClick={() => {
            if (userInfo) {
              handleLogout(); // 使用新弹窗
            } else navigate('/login');
          }}>
            {userInfo ? <><img src={userInfo.avatar} style={styles.userAvatarSmall} alt="" /><span style={styles.userNameSmall}>{userInfo.nickname}</span></> : <><UserCircleOutline /><span>登录</span></>}
          </div>
        </div>
      </div>

      <div style={styles.mainContainer}>
        <PullToRefresh onRefresh={handleRefresh}>
          {isFirstLoading ? (
            <div style={{ padding: '20px 0' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ ...styles.card, height: 200 }}>
                  <Skeleton.Title animated style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <Skeleton.Title animated style={{ width: '60%', marginTop: 10 }} />
                  <Skeleton.Paragraph lineCount={3} animated style={{ marginTop: 20 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ minHeight: '80vh' }}>
              {data.map(post => (
                <PostCard key={post._id} post={post} onAction={(type, p, cb) => {
                  if (type === 'detail') return;
                  if (!checkLogin('/')) return cb && cb(false);
                  if (type === 'like') cb && cb(true);
                  if (type === 'comment') Toast.show('评论区装修中...');
                }} />
              ))}
            </div>
          )}
          {!isFirstLoading && <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />}
        </PullToRefresh>
      </div>

      <div style={styles.fab} className="fab-btn" onClick={() => {
        getToken()?.token ? navigate('/create') : checkLogin('/create');
      }}>
        <AddCircleOutline />
      </div>
    </div>
  );
};

export default Home;
