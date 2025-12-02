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

//启用中文相对时间
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');
const BRAND_COLOR = '#a04030';
const SCROLL_POS_KEY = 'homeScrollPosition';

// ⭐️ 修正 1/5: 缓存 Key 绑定用户 ID
const getCacheKey = (userId) => `likeCache_${userId}`;

// ⭐️ 修正 2/5: 更新点赞缓存函数，要求传入 userId
const updateLikedStateCache = (postId, isLiked, likes, userId) => {
  if (!userId) return;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  userCache[postId] = { isLiked, likes };
  sessionStorage.setItem(cacheKey, JSON.stringify(userCache));
};

// ⭐️ 修正 3/5: 获取点赞缓存函数，要求传入 userId
const getLikedStateFromCache = (postId, userId) => {
  if (!userId) return null;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  return userCache[postId];
};

//---样式定义(保持不变)---
const styles = {
  page: {
    minHeight: '100vh',
  },
  navBar: {
    position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center',
    zIndex: 1000,
    borderBottom: '1px solid#f5f5f5',
  },
  navContent: {
    width: '100%',
    padding: '0 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  navLogo: {
    fontFamily: '"Playfair Display",serif',
    fontSize: '24px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px'
  },
  userArea: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
    borderRadius: '20px', background: '#fff', border: '1px solid#eee', cursor: 'pointer',
  },
  userAvatarSmall: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
  userNameSmall: { fontSize: '13px', color: '#333', fontWeight: '500' },
  mainContainer: {
    width: '100%',
    margin: 0,
    padding: '24px 0 80px 0',
    boxSizing: 'border-box',
  },
  card: {
    background: '#fff',
    margin: '16px',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(160,64,48,0.05)',
    textAlign: 'left',
  },
  header: {
    display: 'flex', alignItems: 'center', marginBottom: '12px',
    justifyContent: 'flex-start'
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px',
    objectFit: 'cover', border: '1px solid#f5f5f5'
  },
  headerInfo: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
  },
  nickname: { fontSize: '15px', fontWeight: '600', color: '#222', lineHeight: '1.2' },
  //修复1:日期使用相对时间
  time: { fontSize: '12px', color: '#999', marginTop: '3px' },
  postTitle: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#111',
    marginBottom: '12px',
    lineHeight: '1.4',
    fontFamily: '"Playfair Display",serif',
    textAlign: 'left',
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: '24px',
    marginTop: '16px', paddingTop: '16px',
    borderTop: '1px solid#f9f9f9'
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
    background: 'var(--c-terra)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 100, cursor: 'pointer'
  },
  expandBtn: {
    color: BRAND_COLOR, fontWeight: '600', cursor: 'pointer', marginTop: '10px', display: 'inline-block', fontSize: '14px'
  }
};
//---注入全局CSS(保持不变)---
const GlobalStyles = () => (
  <style>{`
:root{--c-terra:${BRAND_COLOR};}
.adm-pull-to-refresh-head{background:transparent!important;}
.feed-rich-content{
font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;
font-size:16px;
line-height:1.75;
color:#333;
text-align:left;
}
.feed-rich-content blockquote{
border-left:3px solid var(--c-terra);
background:#fbfbfb;
color:#666;
padding:6px 12px;
margin:12px 0;
border-radius:0 4px 4px 0;
font-style:italic;
}
.feed-rich-content strong{font-weight:700!important;color:#000;}
.feed-rich-content.ql-size-small{font-size:0.85em;color:#666;}
.feed-rich-content.ql-size-large{font-size:1.2em;font-weight:600;margin-top:10px;display:block;}
.feed-rich-content.ql-size-huge{font-size:1.5em;font-weight:800;margin-top:16px;display:block;}
.feed-rich-content ul,.feed-rich-content ol{padding-left:20px;margin:8px 0;}
.feed-rich-content p{margin-bottom:10px;}
@media(max-width:768px){
.fab-btn{right:20px!important;bottom:30px!important;}
}
`}</style>
);
//---图片网格组件(保持不变)---
const ImageGrid = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;
  if (count === 1) {
    return (
      <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid#f0f0f0' }}>
        <img src={images[0]} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} alt=""
          onClick={(e) => { e.stopPropagation(); ImageViewer.Multi.show({ images }); }} />
      </div>
    );
  }
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

//---帖子卡片组件---
// ⭐️ 修正 4/5: PostCard 接收 userInfo
const PostCard = ({ post, onAction, onClick, isLoggedIn, userInfo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentUserId = userInfo?._id;
  // 初始化状态：优先从用户隔离的缓存中获取，其次使用 post 初始值
  const cachedState = getLikedStateFromCache(post._id, currentUserId);

  // 根据是否登录决定是否使用 post.isLiked 或缓存状态
  const initialIsLiked = isLoggedIn && cachedState
    ? cachedState.isLiked
    : (isLoggedIn ? post.isLiked : false) || false;

  // 点赞总数不受登录状态影响，但优先使用缓存
  const initialLikesCount = isLoggedIn && cachedState
    ? cachedState.likes
    : post.likes || 0;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const commentsCount = post.commentsCount || 0;
  const isLong = post.content && post.content.length > 200;

  // 同步 Post 初始数据到本地状态，处理未登录状态的点赞总数
  // 这个 useEffect 会在 Home 列表 data 被更新时触发
  useEffect(() => {
    const freshCachedState = getLikedStateFromCache(post._id, currentUserId);

    const currentIsLiked = isLoggedIn && freshCachedState
      ? freshCachedState.isLiked
      : (isLoggedIn ? post.isLiked : false) || false;

    const currentLikesCount = isLoggedIn && freshCachedState
      ? freshCachedState.likes
      : post.likes || 0;

    setIsLiked(currentIsLiked);
    setLikesCount(currentLikesCount);
  }, [post._id, post.isLiked, post.likes, isLoggedIn, currentUserId]);


  //增强点赞处理，确保状态同步
  const handleLike = (e) => {
    e.stopPropagation();
    // 未登录时，直接触发登录提示，不执行点赞逻辑
    if (!isLoggedIn) {
      onAction('login_required', post);
      return;
    }

    onAction(isLiked ? 'unlike' : 'like', post, (success, newLikedState, newLikesCount) => {
      //成功后乐观更新UI
      if (success) {
        setIsLiked(newLikedState);
        setLikesCount(newLikesCount);
      }
    });
  };
  const handleCommentClick = (e) => {
    e.stopPropagation();
    //修复3:评论按钮直接触发跳转到评论区
    onAction('comment', post);
  }
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 判断是否是当前用户发布的帖子 - 简化并优化判断逻辑
  const isOwnPost = isLoggedIn && userInfo && post.author &&
    (String(userInfo._id || userInfo.id) === String(post.author._id || post.author.id));

  // 决定点赞图标和颜色
  const iconColor = isLoggedIn && isLiked ? BRAND_COLOR : '#999';
  const icon = isLoggedIn && isLiked ? <HeartFill style={{ color: iconColor, fontSize: 20 }} /> : <HeartOutline style={{ fontSize: 20, color: '#999' }} />;
  const textColor = isLoggedIn && isLiked ? BRAND_COLOR : '#666';

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.header}>
        <img src={post.author?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'} alt="" style={styles.avatar} />
        <div style={styles.headerInfo}>
          <div style={styles.nickname}>
            {post.author?.nickname || 'City User'}
            {isOwnPost && <span style={{ color: BRAND_COLOR, fontSize: '12px', marginLeft: '6px' }}>·我的</span>}
          </div>
          {/*修复1:日期使用fromNow()，编辑时间也使用fromNow()格式*/}
          <div style={styles.time}>
            {dayjs(post.createdAt).fromNow()}
            {post.updatedAt && dayjs(post.updatedAt).isAfter(dayjs(post.createdAt)) &&
              <span style={{ marginLeft: '6px' }}>编辑于{dayjs(post.updatedAt).fromNow()}</span>
            }
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <MoreOutline
          fontSize={20}
          color={isOwnPost ? BRAND_COLOR : '#999'}
          onClick={(e) => { e.stopPropagation(); onAction('more', post, isOwnPost, e); }}
          style={{ cursor: isOwnPost ? 'pointer' : 'default' }}
        />
      </div>
      {post.title && (
        <div style={styles.postTitle}>
          {post.title}
        </div>
      )}
      <div onClick={() => { if (isLong) setIsExpanded(!isExpanded); }}>
        <div
          className="feed-rich-content ql-editor"
          style={{
            padding: 0,
            overflow: 'hidden',
            maxHeight: (!isExpanded && isLong) ? '120px' : 'none',
            maskImage: (!isExpanded && isLong) ? 'linear-gradient(to bottom,black 60%,transparent 100%)' : 'none',
            WebkitMaskImage: (!isExpanded && isLong) ? 'linear-gradient(to bottom,black 60%,transparent 100%)' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {isLong && (
          <div style={styles.expandBtn} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            {isExpanded ? '收起' : '展开全文'}
          </div>
        )}
      </div>
      <ImageGrid images={post.images} />
      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {post.tags.map((t, i) => (
            <span key={i} style={{ color: '#666', background: '#f5f5f5', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>#{t}</span>
          ))}
        </div>
      )}
      <div style={styles.footer}>
        <button style={styles.actionBtn} onClick={handleLike}>
          {icon}
          <span style={{ color: textColor, fontWeight: isLiked ? '600' : '400' }}>
            {likesCount > 0 ? likesCount : '赞'}
          </span>
        </button>
        {/*修复3:绑定新的评论点击事件*/}
        <button style={styles.actionBtn} onClick={handleCommentClick}>
          <MessageOutline style={{ fontSize: 20 }} />
          <span>{commentsCount > 0 ? commentsCount : '评论'}</span>
        </button>
      </div>
    </div>
  );
};

//---主页面---
function Home({ isHomeRoute }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFirstLoading, setIsFirstLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  // 下拉菜单状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // ⭐️ 修正 5/5: 获取当前用户 ID
  const currentUserId = userInfo?._id;

  // 判断是否登录
  const isLoggedIn = !!getToken()?.token && !!userInfo;

  useEffect(() => { analytics.track('page_view', { page_id: 'home_feed' }); }, []);

  // 更新 userInfo 的逻辑保持不变
  useEffect(() => {
    const userStr = localStorage.getItem('userInfo');
    const token = getToken();
    if (userStr && token?.token) setUserInfo(JSON.parse(userStr));
    else setUserInfo(null);
  }, [location]);

  //...(Modal,checkLogin,handleLogout保持不变)
  const showThemeModal = (title, content, onConfirm, confirmText = '确定') => {
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
      modalClassName: 'custom-modal-reset',
      bodyStyle: {
        padding: 0,
        backgroundColor: 'transparent',
        width: '100%'
      }
    });
  };
  const checkLogin = (redirectPath, actionType = 'view') => {
    const token = getToken();
    if (!token?.token) {
      // 根据操作类型显示不同的提示文本
      const actionText = actionType === 'publish' ? '发布内容' : '查看内容';
      showThemeModal(
        '需要登录',
        `登录后即可${actionText}并与大家互动，是否前往登录？`,
        () => navigate(`/login?redirect=${redirectPath}`),
        '去登录'
      );
      return false;
    }
    return true;
  };
  const handleLogout = () => {
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

  // --- 增强点赞逻辑，保证缓存同步 ---  
  const handleCardAction = useCallback(async (action, post, isOwnPost = false, e = null, callback) => {
    if (action === 'login_required' || (!isLoggedIn && (action === 'like' || action === 'unlike'))) {
      showThemeModal(
        '尚未登录',
        '请登录后才能进行点赞或评论操作',
        () => navigate('/login'),
        '去登录'
      );
      callback && callback(false);
      return;
    }

    if (action === 'comment') {
      if (!isLoggedIn) {
        showThemeModal(
          '尚未登录',
          '请登录后才能进行点赞或评论操作',
          () => navigate('/login'),
          '去登录'
        );
        callback && callback(false);
        return;
      }
      navigate(`/post/${post._id}`, { state: { scrollTo: 'comments' } });
      return;
    }

    if (action === 'like' || action === 'unlike') {
      const isLiking = action === 'like';
      const updatedLikesCount = post.likes + (isLiking ? 1 : -1);

      try {
        await service.post(`/posts/${post._id}/${action}`);

        // 更新 Home 列表数据
        setData(prevData =>
          prevData.map(item => {
            if (item._id === post._id) {
              return { ...item, isLiked: isLiking, likes: updatedLikesCount };
            }
            return item;
          })
        );

        // 更新缓存
        updateLikedStateCache(post._id, isLiking, updatedLikesCount, currentUserId);

        callback && callback(true, isLiking, updatedLikesCount);
      } catch (error) {
        Toast.show({ content: '操作失败，请重试', icon: 'fail' });
        callback && callback(false);
      }
      return;
    }

    if (action === 'more') {
      // 只有自己的帖子才显示操作菜单
      if (isOwnPost) {
        // 获取点击位置，显示下拉菜单
        const rect = e?.target?.getBoundingClientRect();
        if (rect) {
          setMenuPosition({
            x: rect.right - 160, // 菜单宽度约160px，显示在图标左侧
            y: rect.bottom + 5
          });
          setSelectedPost(post);
          setMenuVisible(true);
        }
      }
    }

    // 处理编辑操作
    if (action === 'edit') {
      setMenuVisible(false);
      // 跳转到编辑页面，并传递帖子数据
      navigate('/create', {
        state: {
          isEdit: true,
          post: post
        }
      });
    }

    // 处理删除操作
    if (action === 'delete') {
      setMenuVisible(false);
      // 显示删除确认弹窗
      showThemeModal(
        '确认删除',
        '确定要删除这篇帖子吗？此操作不可撤销。',
        async () => {
          try {
            await service.delete(`/posts/${post._id}`);
            // 从列表中移除已删除的帖子
            setData(prevData => prevData.filter(item => item._id !== post._id));
            Toast.show({ content: '删除成功', icon: 'success' });
          } catch (error) {
            console.error('删除失败:', error);
            Toast.show({ content: '删除失败，请重试', icon: 'fail' });
          }
        },
        '确认删除'
      );
    }
  }, [navigate, isLoggedIn, currentUserId]);

  // 关闭下拉菜单的函数
  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedPost(null);
  };

  // 点击页面其他区域关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuVisible) {
        setMenuVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuVisible]);

  // --- 下拉刷新 ---
  const handleRefresh = async () => {
    setPage(1);
    try {
      const timestamp = new Date().getTime();
      const res = await service.get(`/posts?page=1&limit=10&t=${timestamp}`);

      const processedList = res.list.map(post => {
        const cachedState = getLikedStateFromCache(post._id, currentUserId);
        if (cachedState) {
          return { ...post, isLiked: cachedState.isLiked, likes: cachedState.likes };
        }
        return { ...post, isLiked: post.isLiked || false, likes: post.likes || 0 };
      });

      setData(processedList || []);
      setHasMore(res.hasMore);
      setPage(2);
      Toast.show({ content: '已更新', position: 'top' });
    } catch (error) {
      console.error('刷新失败:', error);
      Toast.show({ content: '刷新失败，请重试', position: 'top' });
    }
  };

  // --- 加载更多 ---
  const loadMore = async () => {
    if (isFirstLoading) return;
    try {
      const res = await service.get(`/posts?page=${page}&limit=10`);
      const processedList = (res.list || []).map(post => {
        const cachedState = getLikedStateFromCache(post._id, currentUserId);
        if (cachedState) {
          return { ...post, isLiked: cachedState.isLiked, likes: cachedState.likes };
        }
        return { ...post, isLiked: post.isLiked || false, likes: post.likes || 0 };
      });
      setData(prev => [...prev, ...processedList]);
      setHasMore(res.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('加载更多失败:', error);
      Toast.show('加载更多失败，请稍后重试');
      setHasMore(false);
    }
  };

  // 1. 数据初始化和滚动位置恢复
  useEffect(() => {
    const init = async () => {
      //1.获取保存的滚动位置
      const savedPosition = sessionStorage.getItem(SCROLL_POS_KEY);
      const positionValue = savedPosition ? parseInt(savedPosition, 10) : 0;
      //2.刷新数据
      await handleRefresh();
      setIsFirstLoading(false);
      //3.恢复滚动位置(在数据加载并渲染完成后)
      if (positionValue > 10) {
        //延迟滚动，确保DOM已经渲染完毕
        setTimeout(() => {
          window.scrollTo(0, positionValue);
        }, 50);
      } else {
        //首次加载或顶部，确保回到0
        window.scrollTo(0, 0);
      }
    };
    init();
  }, []);//仅在组件挂载时执行


  // --- 同步 Home 列表点赞状态，确保红心一直保持 ---
  useEffect(() => {
    if (isHomeRoute && data.length > 0 && currentUserId) {
      setData(prevData =>
        prevData.map(post => {
          const cachedState = getLikedStateFromCache(post._id, currentUserId);
          if (cachedState) {
            // 缓存存在，优先使用缓存状态
            return {
              ...post,
              isLiked: cachedState.isLiked,
              likes: cachedState.likes
            };
          }
          // 缓存不存在时，保持原本状态，不覆盖红心
          return {
            ...post,
            isLiked: post.isLiked || false,
            likes: post.likes || 0
          };
        })
      );
    }
  }, [location.pathname, isLoggedIn, currentUserId]);


  // 3. 保持滚动位置监听不变(负责实时保存位置)
  useEffect(() => {
    const handleScroll = () => {
      if (isHomeRoute) {
        sessionStorage.setItem(SCROLL_POS_KEY, window.scrollY.toString());
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomeRoute]);

  return (
    <div style={styles.page}>
      <GlobalStyles />
      <div style={styles.navBar}>
        <div style={styles.navContent}>
          <div style={styles.navLogo}>City Daily.</div>
          <div style={styles.userArea} onClick={() => {
            if (userInfo) {
              handleLogout();
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
              <div style={{ minHeight: '80vh' }}>
                {data.map(post => (
                  <PostCard key={post._id}
                    post={post}
                    isLoggedIn={isLoggedIn}
                    userInfo={userInfo} // 传入 userInfo
                    onClick={() => {
                      //修复2:导航到详情页，不传递任何state，让详情页自己重新加载数据
                      if (checkLogin(`/post/${post._id}`)) {
                        navigate(`/post/${post._id}`);
                      }
                    }}
                    onAction={handleCardAction} />
                ))}
              </div>
            </div>
          )}
          {!isFirstLoading && <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />}
        </PullToRefresh>
      </div>
      <div style={styles.fab} className="fab-btn" onClick={() => {
        getToken()?.token ? navigate('/create') : checkLogin('/create', 'publish');
      }}>
        <AddCircleOutline />
      </div>

      {/* 下拉菜单组件 */}
      {menuVisible && selectedPost && (
        <div
          style={{
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            width: '140px',
            zIndex: 2000,
            border: '1px solid #f0f0f0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              color: '#333',
              cursor: 'pointer',
              borderBottom: '1px solid #f5f5f5',
              transition: 'background-color 0.2s'
            }}
            onClick={() => handleCardAction('edit', selectedPost)}
          >
            编辑
          </div>
          <div
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              color: '#ff4d4f',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onClick={() => handleCardAction('delete', selectedPost)}
          >
            删除
          </div>
        </div>
      )}
    </div>
  );
}
export default Home;