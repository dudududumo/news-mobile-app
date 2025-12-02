import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  NavBar,
  ImageViewer,
  Skeleton,
  Toast,
  ActionSheet,
  TextArea,
  Button,
  List,
  Avatar,
  SpinLoading,
} from 'antd-mobile';
import {
  HeartOutline,
  MessageOutline,
  EyeOutline,
  CompassOutline,
  HeartFill,
  SendOutline,
} from 'antd-mobile-icons';
import service, { getToken } from '../services/axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const BRAND_COLOR = '#a04030';

//================== 缓存函数 ==================
const getCacheKey = (userId) => `likeCache_${userId}`;
const updateLikedStateCache = (postId, isLiked, likes, userId) => {
  if (!userId) return;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  userCache[postId] = { isLiked, likes };
  sessionStorage.setItem(cacheKey, JSON.stringify(userCache));
};
const getLikedStateFromCache = (postId, userId) => {
  if (!userId) return null;
  const cacheKey = getCacheKey(userId);
  const userCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
  return userCache[postId];
};

//================== ImageGrid ==================
const ImageGrid = ({ images }) => {
  if (!images || images.length === 0) return null;
  const count = images.length;
  if (count === 1) {
    return (
      <div style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid#f0f0f0' }}>
        <img
          src={images[0]}
          style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
          alt=""
          onClick={(e) => { e.stopPropagation(); ImageViewer.Multi.show({ images }); }}
        />
      </div>
    );
  }
  let cols = count === 2 || count === 4 ? '1fr 1fr' : '1fr 1fr 1fr';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '6px', marginTop: '16px' }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ aspectRatio: '1/1', position: 'relative' }}>
          <img
            src={img}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', background: '#f8f8f8', cursor: 'pointer' }}
            alt=""
            onClick={(e) => { e.stopPropagation(); ImageViewer.Multi.show({ images, defaultIndex: idx }); }}
          />
        </div>
      ))}
    </div>
  );
};

//================== 样式 ==================
const styles = {
  container: { minHeight: '100vh', paddingTop: '56px', paddingBottom: '40px' },
  navBar: { position: 'fixed', top: 0, left: 0, right: 0, height: '56px', zIndex: 100, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)', borderBottom: '1px solid#f5f5f5', display: 'flex', alignItems: 'center' },
  paperCard: { background: '#fff', minHeight: '80vh', margin: '16px', padding: '24px 20px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(62,58,57,0.08)', position: 'relative' },
  accentLine: { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50px', height: '4px', background: BRAND_COLOR, borderRadius: '0 0 2px 2px' },
  header: { display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '20px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px', border: '1px solid#E0E0E0', padding: '1px' },
  nickname: { fontSize: '15px', fontWeight: '600', color: '#222' },
  meta: { fontSize: '12px', color: '#999' },
  title: { fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-serif)', color: '#1a1a1a', marginBottom: '16px', lineHeight: '1.4', borderBottom: '1px solid#f0f0f0', paddingBottom: '16px', textAlign: 'left' },
  content: { fontSize: '16px', lineHeight: '1.75', color: '#333', fontFamily: 'var(--font-sans)', marginBottom: '24px', textAlign: 'left' },
  aiSection: { background: '#FDF6F5', border: `1px dashed${BRAND_COLOR}`, borderRadius: '8px', padding: '12px', marginTop: '24px', marginBottom: '24px' },
  aiTitle: { fontSize: '14px', color: BRAND_COLOR, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  aiTag: { background: '#fff', border: `1px solid rgba(160,64,48,0.2)`, color: 'var(--c-text)', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer' },
  statsBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid#f5f5f5', color: '#888', fontSize: '14px' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#555', fontSize: '15px' },
  liked: { color: BRAND_COLOR, fontWeight: '600' },
  commentSection: { marginTop: '30px', borderTop: '1px solid#f0f0f0', paddingTop: '20px' },
  commentInputArea: { padding: '10px 0', display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' },
  commentListHeader: { fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px', textAlign: 'left' },
  commentContent: { fontSize: 14, color: '#444', marginTop: 4, lineHeight: 1.6, textAlign: 'left' },
  relatedSection: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid#f0f0f0' },
};

//================== 骨架屏 ==================
const DetailSkeleton = () => (
  <div style={{ padding: '72px 16px 16px' }}>
    <Skeleton.Title animated style={{ height: 40, marginBottom: 20 }} />
    <Skeleton.Paragraph animated lineCount={15} />
  </div>
);

//================== PostDetail ==================
const PostDetail = ({ isAuthenticated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginAction, setShowLoginAction] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const commentsSectionRef = useRef(null);
  const fetchRef = useRef(false);
  const userInfoStr = localStorage.getItem('userInfo');
  const currentUserId = userInfoStr ? JSON.parse(userInfoStr)._id : null;

  //================== 数据加载 ==================
  const fetchPostDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.get(`/posts/${id}`);
      let fetchedPost = res.data || res;
      const cachedState = getLikedStateFromCache(id, currentUserId);
      if (cachedState) {
        fetchedPost = { ...fetchedPost, isLiked: isAuthenticated ? cachedState.isLiked : false, likes: cachedState.likes };
      } else {
        fetchedPost = { ...fetchedPost, isLiked: isAuthenticated ? fetchedPost.isLiked : false };
      }
      setPost(fetchedPost);
    } catch (e) {
      Toast.show('内容无法送达');
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId, isAuthenticated]);

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

  const fetchRelatedPosts = useCallback(async () => {
    if (!id) return;
    try {
      const res = await service.get(`/posts/${id}/related`);
      setPost(prev => ({ ...prev, relatedPosts: res.relatedPosts || [] }));
    } catch (e) { console.error('Failed to fetch related posts:', e); }
  }, [id]);

  //================== 评论提交 ==================
  const handleSubmitComment = async () => {
    if (!isAuthenticated) { setShowLoginAction(true); return; }
    if (commentContent.trim() === '') { Toast.show('评论内容不能为空'); return; }
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

  //================== 点赞 ==================
  const handleLike = async () => {
    if (!isAuthenticated) { setShowLoginAction(true); return; }
    if (!post) return;
    const isLiked = post.isLiked || false;
    const newLikedState = !isLiked;
    const newLikesCount = post.likes + (isLiked ? -1 : 1);
    setPost(prev => ({ ...prev, likes: newLikesCount, isLiked: newLikedState }));
    updateLikedStateCache(post._id, newLikedState, newLikesCount, currentUserId);
    try {
      const url = `/posts/${post._id}/${isLiked ? 'unlike' : 'like'}`;
      await service.post(url);
    } catch (e) {
      setPost(prev => ({ ...prev, likes: post.likes, isLiked: isLiked }));
      updateLikedStateCache(post._id, isLiked, post.likes, currentUserId);
      Toast.show('操作失败');
    }
  };

  const handleCommentClick = () => { if (!isAuthenticated) { setShowLoginAction(true); return; } if (commentsSectionRef.current) { commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const handleLoginAction = (action) => { setShowLoginAction(false); if (action.key === 'login') { navigate('/login', { state: { from: `/post/${id}` } }); } };
  const handleChallenge = (tag) => { navigate('/create', { state: { autoFillTopic: tag } }); };

  //================== 初始加载 ==================
  useEffect(() => { fetchPostDetail(); }, [id, fetchPostDetail]);
  useEffect(() => {
    if (post?._id) {
      fetchComments();
      fetchRelatedPosts();
      if (location.state?.scrollTo === 'comments' && commentsSectionRef.current) {
        const timer = setTimeout(() => { commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [post, fetchComments, fetchRelatedPosts, location.state]);

  if (loading) return <DetailSkeleton />;
  if (!post) return <div style={{ paddingTop: 100, textAlign: 'center', color: '#999' }}>内容已随风而去</div>;

  const isLiked = isAuthenticated ? (post?.isLiked || false) : false;
  const commentsCount = post?.commentsCount || 0;
  const icon = isLiked ? <HeartFill /> : <HeartOutline />;

  return (
    <div style={styles.container}>
      <style>{`
        :root{--c-terra:${BRAND_COLOR};}
        .detail-html p{margin-bottom:1em;text-align:left;}
        .detail-html blockquote{border-left:4px solid var(--c-terra);background:#fcf8f7;padding:12px 16px;margin:16px 0;color:#666;font-family:var(--font-serif);font-style:italic;border-radius:0 4px 4px 0;}
        .detail-html ul,.detail-html ol{padding-left:20px;margin:10px 0;}
        .detail-html li{margin-bottom:0.5em;}
        .detail-html img{max-width:100%;height:auto;border-radius:6px;margin:10px 0;display:block;}
        .detail-html h1,.detail-html h2,.detail-html h3{font-family:var(--font-serif);margin:20px 0 10px 0;border-bottom:1px solid#eee;padding-bottom:5px;font-weight:700;color:#1a1a1a;}
        .detail-html strong{font-weight:700;color:#000;}
        .detail-html*{text-align:left;}
      `}</style>

      <NavBar onBack={() => navigate(-1)} style={styles.navBar}>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>City Daily.</span>
      </NavBar>

      <div style={styles.paperCard}>
        <div style={styles.accentLine} />

        {/* 作者信息 */}
        <div style={styles.header}>
          <img src={post.author?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=0'} style={styles.avatar} alt="author avatar" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={styles.nickname}>{post.author?.nickname || '匿名用户'}</span>
              <span style={styles.meta}>{dayjs(post.createdAt).format('YYYY-MM-DD')}</span>
            </div>
          </div>
        </div>

        {/* 标题与内容 */}
        {post.title && <div style={styles.title}>{post.title}</div>}
        <div className="detail-html ql-editor" style={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* 图片 */}
        {post.images?.length > 0 && <ImageGrid images={post.images} />}

        {/* AI 标签 */}
        {post.tags?.length > 0 && (
          <div style={styles.aiSection}>
            <div style={styles.aiTitle}><CompassOutline /><span>AI灵感延伸</span></div>
            <div style={styles.tagContainer}>
              {post.tags.map((tag, i) => (
                <div key={i} style={styles.aiTag} onClick={() => handleChallenge(tag)}>
                  <span style={{ color: BRAND_COLOR, fontWeight: 'bold' }}>#</span>{tag}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 统计栏 */}
        <div style={styles.statsBar}>
          <span><EyeOutline style={{ marginRight: 4 }} />{post.views || 0}阅读</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ ...styles.actionButton, ...(isLiked ? styles.liked : {}) }} onClick={handleLike}>
              {icon}<span>{post.likes || 0}</span>
            </div>
            <div style={styles.actionButton} onClick={handleCommentClick}>
              <MessageOutline /><span>{commentsCount > 0 ? commentsCount : '评论'}</span>
            </div>
          </div>
        </div>

        {/* 相关阅读 */}
        {post.relatedPosts?.length > 0 && (
          <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px dashed#eee' }}>
            <div style={styles.aiTitle}><CompassOutline style={{ fontSize: 14 }} />相关阅读</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {post.relatedPosts.map(p => (
                <div key={p._id} style={{ padding: '8px 0', borderBottom: '1px solid#f0f0f0', cursor: 'pointer' }} onClick={() => navigate(`/post/${p._id}`)}>
                  <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{p.title || p.content.substring(0, 30)}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{p.tags?.slice(0, 2).map(t => `#${t}`).join('') || '相关文章'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 评论区 */}
        <div ref={commentsSectionRef} style={styles.commentSection}>
          <div style={styles.commentInputArea}>
            <TextArea
              placeholder={isAuthenticated ? '留下你的精彩评论...' : '请登录后才能评论...'}
              value={commentContent}
              onChange={val => setCommentContent(val)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1, '--font-size': '15px' }}
              disabled={!isAuthenticated}
            />
            <Button size="small" onClick={handleSubmitComment} style={{ '--background-color': BRAND_COLOR, '--border-color': BRAND_COLOR, '--text-color': '#fff' }} disabled={!isAuthenticated || commentContent.trim() === ''}><SendOutline /></Button>
          </div>
          <div style={styles.commentListHeader}>全部评论({commentsCount})</div>

          {commentsLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}><SpinLoading style={{ '--size': '24px' }} /></div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment._id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <Avatar src={comment.user?.avatar} style={{ '--size': '36px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: '#555' }}>{comment.user?.nickname}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>{dayjs(comment.createdAt).fromNow()}</span>
                  </div>
                  <div style={{ marginTop: 4 }} dangerouslySetInnerHTML={{ __html: comment.content }} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>还没有评论，快来抢占沙发吧！</div>
          )}
        </div>

      </div>

      {/* 登录提示 */}
      <ActionSheet
        visible={showLoginAction}
        actions={[{ key: 'login', text: '去登录', primary: true, style: { color: BRAND_COLOR } }]}
        cancelText='取消'
        onClose={() => setShowLoginAction(false)}
        onAction={handleLoginAction}
        extra={'查看文章详情和互动需要登录'}
      />
    </div>
  );
};

export default PostDetail;
