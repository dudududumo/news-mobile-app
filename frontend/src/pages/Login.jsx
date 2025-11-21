import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import service, { setToken } from '../services/axios';

// 样式对象
const styles = {
  // 外层容器：全屏居中
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  // 核心卡片：白色、阴影、圆角
  card: {
    width: '100%',
    maxWidth: '360px', // 限制最大宽度，在大屏下也保持精致
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px 30px',
    boxShadow: '0 20px 40px rgba(62, 58, 57, 0.08)', // 极其柔和的阴影
    position: 'relative',
    overflow: 'hidden', // 可以在卡片内做一些装饰背景
  },
  // 顶部装饰线 (陶土色)
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'var(--c-terra)',
  },
  // 标题区
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontFamily: 'var(--font-serif)', // 衬线体标题
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: '8px',
    letterSpacing: '1px',
  },
  subTitle: {
    fontSize: '12px',
    color: '#999',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  // Tab 切换区
  tabGroup: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #f0f0f0',
  },
  tabItem: {
    padding: '10px 20px',
    fontSize: '15px',
    cursor: 'pointer',
    color: '#999',
    transition: 'all 0.3s',
    position: 'relative',
  },
  activeTab: {
    color: 'var(--c-terra)',
    fontWeight: 600,
  },
  // 底部区域
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#ccc',
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const switchTab = (key) => {
    setActiveTab(key);
    form.resetFields();
    setCountdown(0);
  };

  const handleGetCode = async () => {
    try {
      const mobile = form.getFieldValue('phone');
      if (!mobile) return Toast.show('请输入手机号');
      await service.post('/auth/send-code', { phone: mobile });
      Toast.show({ content: '已发送', icon: 'success' });
      setCountdown(60);
    } catch (error) { }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        phone: values.phone,
        code: values.code,
        ...(activeTab === 'register' ? { nickname: values.nickname } : {})
      };
      const res = await service.post('/auth/login', payload);
      setToken({ token: res.token, expiresAt: res.expiresAt });

      // 根据当前是登录还是注册显示不同的提示
      if (activeTab === 'register') {
        Toast.show({ content: '注册成功！', icon: 'success' });
        // 注册成功后直接处理，不跳转到登录界面
      } else {
        Toast.show({ content: '登录成功！', icon: 'success' });
      }

      // 无论是登录还是注册成功，都可以跳转到首页或其他受保护的页面
      setTimeout(() => {
        navigate('/'); // 跳转到首页
      }, 1500);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 装饰线条 */}
        <div style={styles.topLine} />

        {/* 精致的标题 */}
        <div style={styles.header}>
          <div style={styles.title}>City Daily.</div>
          <div style={styles.subTitle}>Curated for you</div>
        </div>

        {/* 居中的 Tab 切换 */}
        <div style={styles.tabGroup}>
          <div
            style={{ ...styles.tabItem, ...(activeTab === 'login' ? styles.activeTab : {}) }}
            onClick={() => switchTab('login')}
          >
            登 录
            {activeTab === 'login' && (
              <span style={{
                position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, background: 'var(--c-terra)'
              }} />
            )}
          </div>
          <div
            style={{ ...styles.tabItem, ...(activeTab === 'register' ? styles.activeTab : {}) }}
            onClick={() => switchTab('register')}
          >
            注 册
            {activeTab === 'register' && (
              <span style={{
                position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, background: 'var(--c-terra)'
              }} />
            )}
          </div>
        </div>

        {/* 表单区域 */}
        <Form
          form={form}
          onFinish={onFinish}
          style={{ '--border-top': 'none', '--border-bottom': 'none' }}
        >
          {activeTab === 'register' && (
            <Form.Item name='nickname' rules={[{ required: true, message: '请输入昵称' }]}>
              <div className="refined-input">
                <Input placeholder='Nick Name / 昵称' />
              </div>
            </Form.Item>
          )}

          <Form.Item name='phone' rules={[{ required: true, message: '请输入手机号' }]}>
            <div className="refined-input">
              <Input placeholder='Mobile Number / 手机号' />
            </div>
          </Form.Item>

          <Form.Item
            name='code'
            rules={[{ required: true, message: '请输入验证码' }]}
            extra={
              <span
                onClick={countdown === 0 ? handleGetCode : null}
                style={{
                  fontSize: '13px',
                  color: countdown > 0 ? '#ccc' : 'var(--c-terra)',
                  cursor: 'pointer'
                }}
              >
                {countdown > 0 ? `${countdown}s` : 'Get Code'}
              </span>
            }
          >
            <div className="refined-input">
              <Input placeholder='Verification Code / 验证码' />
            </div>
          </Form.Item>

          {/* 提交按钮：略微圆角，不再是死板的直角，也不那么大 */}
          <Button
            block
            type='submit'
            loading={loading}
            style={{
              marginTop: '30px',
              background: 'var(--c-terra)',
              border: 'none',
              color: '#fff',
              borderRadius: '4px', // 小圆角
              fontSize: '16px',
              height: '44px', // 高度减小，显得秀气
              boxShadow: '0 4px 12px rgba(160, 64, 48, 0.2)' // 投影
            }}
          >
            {activeTab === 'login' ? 'Sign In' : 'Join Us'}
          </Button>
        </Form>

        <div style={styles.footer}>
          City Daily &copy; 2025
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
