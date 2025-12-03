// Postdetail：
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { NavBar, ImageViewer, Skeleton, Toast, ActionSheet, TextArea, Button, List, Modal } from 'antd-mobile';
import { HeartOutline, MessageOutline, EyeOutline, CompassOutline, HeartFill, SendOutline, DeleteOutline } from 'antd-mobile-icons';
import service, { getToken } from '../services/axios'; // 确保 getToken 被引入
import analytics from '../services/analytics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

//修复1:仅启用中文相对时间扩展，但不设置locale为默认（因为主帖子需要YYYY-MM-DD）
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');//确保fromNow()是中文的
const BRAND_COLOR = '#a04030';

// 图片网格组件 - 与Home页面保持一致
const ImageGrid = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;
  if (count === 1) {
    return (
      <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid#f0f0f0' }}>
        <img src={images[0]} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} alt=""
          onClick={() => { ImageViewer.Multi.show({ images }); }} />
      </div>
    );
  }
  let cols = count === 2 || count === 4 ? '1fr 1fr' : '1fr 1fr 1fr';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', marginTop: '12px' }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ aspectRatio: '1/1', position: 'relative' }}>
          <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', background: '#f8f8f8' }} alt=""
            onClick={() => { ImageViewer.Multi.show({ images, defaultIndex: idx }); }} />
        </div>
      ))}
    </div>
  );
}

// ⭐️ 修正 1/4: 缓存 Key 绑定用户 ID
const getCacheKey = (userId) => `likeCache_${userId}`;

// ⭐️ 修正 2/4: 更新点赞缓存函数，要求传入 userId
const updateLikedStateCache = (postId, isLiked, likes, userId) => {
  if (!userId) return;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  userCache[postId] = { isLiked, likes };
  sessionStorage.setItem(cacheKey, JSON.stringify(userCache));
};

// ⭐️ 修正 3/4: 获取点赞缓存函数，要求传入 userId
const getLikedStateFromCache = (postId, userId) => {
  if (!userId) return null;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  return userCache[postId];
};

//---样式定义(保持不变)---
const styles = {
  container: {
    minHeight: '100vh',
    padding: '60px 16px 40px 16px', // 统一四周的padding
    margin: 0,
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
    padding: '0 16px', // 与内容区域保持一致的padding
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
  navLogo: {
    fontFamily: '"Playfair Display",serif',
    fontSize: '24px', fontWeight: '700', color: '#000', letterSpacing: '-0.5px',
    flex: 1,
    textAlign: 'center'
  },
  // 简化布局，移除内容框设计
  contentWrapper: {
    padding: 0, // 移除padding，因为已经在container上设置了
    maxWidth: '100%',
    width: '100%',
    margin: 0,
  },
  accentLine: {
    position: 'absolute',
    top: 0, left: '50%', transform: 'translateX(-50%)',
    width: '50px',
    height: '4px',
    background: BRAND_COLOR,
    borderRadius: '0 0 2px 2px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '12px', // 减小顶部间距
    marginBottom: '20px',
    padding: '0', // 移除左右padding
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '10px',
    border: '1px solid#E0E0E0',
    padding: '1px',
  },
  nickname: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#222',
    lineHeight: '1.2',
  },
  meta: {
    fontSize: '12px',
    color: '#999',
    marginTop: '3px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: '"Playfair Display",serif',
    color: '#1a1a1a',
    marginBottom: '12px',
    lineHeight: '1.4',
    textAlign: 'left',
    width: '100%',
  },
  content: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#333',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif',
    marginBottom: '16px',
    textAlign: 'left',
    width: '100%',
  },
  // 图片相关样式已移至ImageGrid组件
  aiSection: {
    background: '#FDF6F5',
    border: `1px dashed${BRAND_COLOR}`,
    borderRadius: '8px',
    padding: '12px',
    marginTop: '30px',
    marginBottom: '30px',
    position: 'relative',
  },
  aiTitle: {
    fontSize: '14px',
    color: BRAND_COLOR,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '0px',
  },
  aiTag: {
    background: '#fff',
    border: `1px solid rgba(160,64,48,0.2)`,
    color: 'var(--c-text)',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid#f5f5f5',
    color: '#999',
    fontSize: '13px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    color: '#999',
    transition: 'color 0.2s',
  },
  liked: {
    color: BRAND_COLOR,
  },
  commentSection: {
    marginTop: '25px',
    borderTop: '1px solid#f0f0f0',
    paddingTop: '16px',
    backgroundColor: 'transparent', // 确保背景透明
  },
  commentInputArea: {
    padding: '10px 0',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '20px',
  },
  commentListHeader: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    textAlign: 'left',
  },
  commentContent: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'left',//修复问题4
    backgroundColor: 'transparent',
  },
  '.adm-list.adm-list-default': { backgroundColor: 'transparent' },
};
//骨架屏(不变)
const DetailSkeleton = () => (
  <div style={{ padding: 16 }}>
    <Skeleton.Title animated style={{ height: 60, marginBottom: 20 }} />
    <Skeleton.Paragraph animated lineCount={10} />
  </div>
);

const PostDetail = ({ isAuthenticated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();//引入useLocation接收state
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginAction, setShowLoginAction] = useState(false);
  const fetchRef = useRef(false);


  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const commentsSectionRef = useRef(null);

  // ⭐️ 新增：获取当前用户信息
  const [userInfo, setUserInfo] = useState(null);
  
  // 从localStorage获取用户信息
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('userInfo');
      }
    }
  }, []);
  
  const currentUserId = userInfo?._id;


  //获取评论列表 (不变)
  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const res = await service.get(`/posts/${id}/comments`);
      setComments(res.comments || []);
    } catch (e) {
      Toast.show({ content: '加载评论失败', icon: 'fail' });
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  //提交评论 (不变)
  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      Toast.show('请先登录才能评论');
      return;
    }
    if (commentContent.trim() === '') {
      Toast.show('评论内容不能为空');
      return;
    }
    try {
      Toast.show({ content: '发送中...', icon: 'loading', duration: 0 });
      const res = await service.post(`/posts/${id}/comments`, { content: commentContent });
      setComments(prev => [res.comment, ...prev]);
      setPost(prev => ({ ...prev, commentsCount: res.commentsCount }));
      setCommentContent('');
      Toast.show({ content: '评论成功', icon: 'success' });
    } catch (e) {
      Toast.show({ content: e.response?.data?.message || '评论失败', icon: 'fail' });
    }
  };

  //详情数据加载
  //修复2:检查缓存并覆盖后端的isLiked/likes状态
  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const res = await service.get(`/posts/${id}`);
      let fetchedPost = res.data || res;

      //修复2:检查缓存并覆盖后端的isLiked/likes状态
      // ⭐️ 关键修正：读取缓存时传入当前用户ID
      const cachedState = getLikedStateFromCache(id, currentUserId);
      if (cachedState) {
        fetchedPost = {
          ...fetchedPost,
          // 只有在登录状态下才使用缓存的 isLiked 状态
          isLiked: isAuthenticated ? cachedState.isLiked : false,
          likes: cachedState.likes
        };
      } else {
        // 未登录时，强制 isLiked 为 false
        fetchedPost = {
          ...fetchedPost,
          isLiked: isAuthenticated ? fetchedPost.isLiked : false,
        };
      }

      setPost(fetchedPost);
    } catch (e) {
      Toast.show('内容无法送达');
      console.error('Error fetching post detail:', e);
    } finally {
      setLoading(false);
    }
  };

  // 简化数据加载逻辑，根据id变化重新加载数据
  useEffect(() => {
    // 重置fetchRef，确保每次id变化时都重新加载数据
    fetchRef.current = false;

    // 当有id时调用fetchPostDetail
    if (id) {
      fetchRef.current = true;
      fetchPostDetail();
      // 移除页面加载时的登录提示，允许未登录用户查看内容
    }
  }, [id]); // 当id变化时重新执行

  // 删除评论功能
  const [commentToDelete, setCommentToDelete] = useState(null);

  // 显示主题化弹窗（与Home页面一致的样式）
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

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    showThemeModal('确认删除', '确定要删除这条评论吗？', confirmDeleteComment, '删除');
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      Toast.show({ content: '删除中...', icon: 'loading', duration: 0 });
      const res = await service.delete(`/posts/${id}/comments/${commentToDelete}`);
      
      // 更新评论列表
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== commentToDelete)
      );
      
      // 更新帖子的评论数
      setPost(prevPost => ({
        ...prevPost,
        commentsCount: res.commentsCount || prevPost.commentsCount - 1
      }));
      
      // 记录埋点
      analytics.track('comment_delete', {
        userId: currentUserId,
        postId: id,
        commentId: commentToDelete
      });
      
      Toast.show({ content: '删除成功', icon: 'success' });
    } catch (error) {
      console.error('删除评论失败:', error);
      Toast.show({ 
        content: error.response?.data?.message || '删除评论失败', 
        icon: 'fail' 
      });
    } finally {
      setCommentToDelete(null);
    }
  };

  //加载评论列表并在需要时滚动到评论区 (不变)
  useEffect(() => {
    if (post?._id) {
      fetchComments();
      //修复3:检查是否有跳转到评论区的state
      if (location.state?.scrollTo === 'comments' && commentsSectionRef.current) {
        //使用setTimeout确保页面渲染完成和评论区组件加载后再滚动
        const timer = setTimeout(() => {
          commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [post, fetchComments, location.state]);

  //滚动到评论区 (不变)
  const handleCommentClick = () => {
    if (!isAuthenticated) {
      setShowLoginAction(true);
      return;
    }
    if (commentsSectionRef.current) {
      commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  //增强点赞逻辑，成功后更新缓存
  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLoginAction(true);
      return;
    }

    // post 应该总是有值，否则 handleLike 不会被调用
    if (!post) return;

    const isLiked = post.isLiked || false;
    const newLikedState = !isLiked;
    const newLikesCount = post.likes + (isLiked ? -1 : 1);

    try {
      //1.乐观更新UI
      setPost(prev => ({
        ...prev,
        likes: newLikesCount,
        isLiked: newLikedState
      }));

      const url = `/posts/${post._id}/${isLiked ? 'unlike' : 'like'}`;
      await service.post(url);

      //2.更新缓存，确保Home页面也能获取到最新状态
      // ⭐️ 关键修正：写入缓存时传入 userId
      updateLikedStateCache(post._id, newLikedState, newLikesCount, currentUserId);

      // 重新获取详情，确保数据最新（尽管缓存已更新）
      // fetchPostDetail(); 
    } catch (e) {
      //失败后回滚UI
      setPost(prev => ({
        ...prev,
        likes: post.likes,//回滚到原始值
        isLiked: isLiked
      }));
      Toast.show('操作失败');
    }
  };

  //...(其他函数保持不变)
  const handleLoginAction = (action) => {
    setShowLoginAction(false);
    if (action.key === 'login') {
      navigate('/login', { state: { from: `/post/${id}` } });
    }
  }
  const handleChallenge = (tag) => {
    navigate('/create', {
      state: { autoFillTopic: tag }
    });
  };
  const renderRelatedPosts = (related) => (
    <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px dashed#eee' }}>
      <div style={styles.aiTitle}>
        <CompassOutline style={{ fontSize: 14 }} />
        相关阅读
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {related.map(p => (
          <div
            key={p._id}
            style={{ padding: '8px 0', borderBottom: '1px solid#f0f0f0', cursor: 'pointer' }}
            onClick={() => {
              // 正常导航到新的帖子详情页
              navigate(`/post/${p._id}`);
            }}
          >
            <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{p.title}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {p.tags?.slice(0, 2).map(t => `#${t}`).join('') || '相关文章'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <DetailSkeleton />;
  if (!post) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>内容已随风而去</div>;
  }

  // 强制未登录时 isLiked 为 false，但仍显示点赞总数
  const isLiked = isAuthenticated ? (post?.isLiked || false) : false;
  const commentsCount = post?.commentsCount || 0;

  // 决定点赞图标和颜色
  const iconColor = isLiked ? BRAND_COLOR : '#999';
  const icon = isLiked ? <HeartFill /> : <HeartOutline />;

  return (
    <div style={styles.container}>
      <style>{`
        :root{--c-terra:${BRAND_COLOR};}
        .detail-html p{margin-bottom:1em;text-align:left;}
        .detail-html blockquote{
          border-left:4px solid var(--c-terra);
          background:#fcf8f7;
          padding:12px 16px;
          margin:16px 0;
          color:#666;
          font-family:var(--font-serif);
          font-style:italic;
          border-radius:0 4px 4px 0;
        }
        .detail-html ul,.detail-html ol{
          padding-left:20px;
          margin:10px 0;
        }
        .detail-html li{margin-bottom:0.5em;}
        .detail-html img{
          max-width:100%;
          height:auto;
          border-radius:6px;
          margin:10px 0;
          display:block;
        }
        /* 统一内容字体样式 */
        .detail-html {
          font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif;
          font-size:16px;
          line-height:1.7;
        }
        .detail-html h1,.detail-html h2,.detail-html h3{
          font-family:var(--font-serif);
          margin:20px 0 10px 0;
          border-bottom:1px solid#eee;
          padding-bottom:5px;
          font-weight:700;
          color:#1a1a1a;
        }
        .detail-html strong{font-weight:700;color:#000;}
        .detail-html*{text-align:left;}
      `}</style>
      <div style={styles.navBar}>
        <div style={styles.navContent}>
          <div onClick={() => navigate('/')} style={styles.backButton}>
            &lt;
          </div>
          <div style={styles.navLogo}>City Daily.</div>
          <div style={{ width: '24px' }} /> {/* 占位元素，保持logo居中 */}
        </div>
      </div>
      <div style={styles.contentWrapper}>
        <div style={styles.accentLine} />
        {post && (
          <>
            <div style={{ ...styles.header, alignItems: 'flex-start' }}>
              <img src={post.author?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=0'} style={styles.avatar} alt="" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ ...styles.nickname, textAlign: 'left' }}>{post.author?.nickname || '匿名用户'}</div>
                {/*修复1:主帖子使用YYYY-MM-DD格式*/}
                <div style={{ ...styles.meta, textAlign: 'left' }}>
                  {dayjs(post.createdAt).format('YYYY-MM-DD')}
                  {post.editAt && dayjs(post.editAt).isAfter(dayjs(post.createdAt)) &&
                    <span style={{ marginLeft: '8px' }}>编辑于{dayjs(post.editAt).format('YYYY-MM-DD')}</span>
                  }
                </div>
              </div>
            </div>
            {post.title && <div style={styles.title}>{post.title}</div>}
            <div
              className="detail-html ql-editor"
              style={{
                ...styles.content,
                width: '100%',
                maxWidth: 'none',
                margin: '0',
                padding: '0'
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.images?.length > 0 && <ImageGrid images={post.images} />}
            {post.tags?.length > 0 && (
              <div style={styles.aiSection}>
                <div style={styles.aiTitle}>
                  <CompassOutline />
                  <span>AI灵感延伸</span>
                </div>
                <div style={styles.tagContainer}>
                  {post.tags.map((tag, i) => (
                    <div key={i} style={styles.aiTag} onClick={() => handleChallenge(tag)}>
                      <span style={{ color: BRAND_COLOR, fontWeight: 'bold' }}>#</span>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.statsBar}>
              <span><EyeOutline />{post.views || 0}阅读</span>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ ...styles.actionButton, ...(isLiked ? styles.liked : {}) }} onClick={handleLike}>
                  {icon} {/* 使用动态图标 */}
                  {post.likes || 0}
                </div>
                <div style={styles.actionButton} onClick={handleCommentClick}>
                  <MessageOutline />{commentsCount > 0 ? commentsCount : '评论'}
                </div>
              </div>
            </div>
            {post.relatedPosts?.length > 0 && renderRelatedPosts(post.relatedPosts)}
            <div ref={commentsSectionRef} style={styles.commentSection}>
              <div style={styles.commentListHeader}>
                评论({commentsCount})
              </div>
              <div style={styles.commentInputArea}>
                <TextArea
                  placeholder={isAuthenticated ? '留下你的精彩评论...' : '请登录后才能评论...'}
                  value={commentContent}
                  onChange={setCommentContent}
                  autoSize
                  style={{ flex: 1, border: '1px solid#ddd', borderRadius: '8px', padding: '6px 10px', minHeight: '40px', fontSize: '12px' }}
                  disabled={!isAuthenticated}
                />
                <Button
                  onClick={handleSubmitComment}
                  color='primary'
                  style={{ '--border-radius': '8px', '--background-color': BRAND_COLOR, alignSelf: 'flex-end' }}
                  disabled={commentContent.trim() === '' || !isAuthenticated}
                >
                  <SendOutline />
                </Button>
              </div>
              {commentsLoading ? (
                <Skeleton.Paragraph animated lineCount={3} />
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '14px' }}>
                  暂无评论，快来抢沙发吧!
                </div>
              ) : (
                <div style={{ backgroundColor: 'transparent' }}>
                  {comments.map((comment, index) => (
                    <div key={comment._id || index} style={{ 
                      backgroundColor: 'transparent', 
                      padding: '12px 0',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* 评论作者信息 */}
                      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 0, backgroundColor: 'transparent' }}>
                        <img
                          src={comment.user?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=0'}
                          alt="avatar"
                          style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '8px' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: '500', color: '#333' }}>
                          {comment.user?.nickname || '匿名用户'}
                          {/* 添加"我的"标识 */}
                          {isAuthenticated && userInfo && comment.user && 
                           (String(userInfo._id || userInfo.id) === String(comment.user._id || comment.user.id)) && (
                            <span style={{ fontSize: 11, color: '#999', marginLeft: '4px' }}>(我的)</span>
                          )}
                        </span>
                      </div>
                      {/* 评论内容 */}
                      <div style={{ 
                        ...styles.commentContent, 
                        marginLeft: '36px', // 右移评论内容，与头像对齐
                        paddingLeft: '8px' // 额外内边距使内容更靠右
                      }}>
                        {comment.content}
                        <div style={{ fontSize: 11, color: '#999', marginTop: 8, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                          {/*修复1:评论区日期保持相对时间*/}
                          <span style={{ marginRight: '12px' }}>{dayjs(comment.createdAt).fromNow()}</span>
                          {/* 只有评论作者可见删除按钮 */}
                          {isAuthenticated && userInfo && comment.user && 
                           (String(userInfo._id || userInfo.id) === String(comment.user._id || comment.user.id)) && (
                            <DeleteOutline
                              onClick={() => handleDeleteComment(comment._id)}
                              style={{ 
                                cursor: 'pointer', 
                                fontSize: '14px', 
                                color: BRAND_COLOR, // 使用品牌主题色
                                marginLeft: 'auto' // 保持删除按钮在右侧
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ActionSheet
        visible={showLoginAction}
        actions={[
          { key: 'login', text: '去登录', primary: true, style: { color: BRAND_COLOR } },
          { key: 'cancel', text: '取消', danger: true },
        ]}
        onClose={() => setShowLoginAction(false)}
        onAction={handleLoginAction}
        extra={'查看文章详情和互动需要登录'}
      />
      
      {/* 评论删除确认模态框 - 使用与Home页面一致的样式 */}
    </div>
  );
};
export default PostDetail;