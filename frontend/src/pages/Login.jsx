import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import service, { setToken } from '../services/axios';

// --- 样式定义 ---
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    // 背景纹理已经在 index.css body 中定义，这里只需透明或保持布局
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px 30px',
    boxShadow: '0 20px 40px rgba(62, 58, 57, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '4px',
    background: 'var(--c-terra)', // 引用全局变量
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontFamily: 'var(--font-serif)', // 引用全局变量
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
  // Tab 切换样式
  tabGroup: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #f0f0f0',
  },
  tabItem: {
    padding: '10px 20px',
    fontSize: '15px',
    cursor: 'pointer',
    color: '#999',
    transition: 'all 0.3s',
    position: 'relative',
    fontFamily: 'var(--font-sans)',
  },
  activeTab: {
    color: 'var(--c-terra)',
    fontWeight: '600',
  },
  // 登录方式切换 (密码/验证码)
  loginTypeGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '24px',
    fontSize: '13px',
  },
  loginTypeItem: {
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#ccc',
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 状态管理
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loginType, setLoginType] = useState('password'); // 'password' | 'sms'

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时逻辑
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 切换 Tab (登录/注册)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    form.resetFields();
    // 如果切到注册，默认不需要选登录方式，但在逻辑上重置比较安全
    if (tab === 'register') {
      setLoginType('password'); // 注册默认也是输入密码+验证码
    }
  };

  // 发送验证码
  const handleGetCode = async () => {
    const mobile = form.getFieldValue('phone');
    if (!mobile) return Toast.show('请输入手机号');
    // 简单校验手机号格式
    if (!/^1[3-9]\d{9}$/.test(mobile)) return Toast.show('手机号格式不正确');

    try {
      await service.post('/auth/send-code', { phone: mobile });
      Toast.show({ content: '验证码已发送', icon: 'success' });
      setCountdown(60);
    } catch (error) {
      console.error('Send code error:', error);
      // 错误信息通常由拦截器处理，这里可以不做额外处理
    }
  };

  // 提交表单
  const onFinish = async (values) => {
    setLoading(true);
    try {
      let res;

      // --- 注册逻辑 ---
      if (activeTab === 'register') {
        if (values.password !== values.confirmPassword) {
          setLoading(false);
          return Toast.show('两次输入的密码不一致');
        }
        // 构造后端 /register 接口需要的 payload
        const registerPayload = {
          phone: values.phone,
          nickname: values.nickname,
          password: values.password,
          code: values.code // 注册必须验证码
        };
        res = await service.post('/auth/register', registerPayload);
      }

      // --- 登录逻辑 ---
      else {
        if (loginType === 'password') {
          // 密码登录
          res = await service.post('/auth/login', {
            phone: values.phone,
            password: values.password,
            loginType: 'password'
          });
        } else {
          // 验证码登录
          res = await service.post('/auth/login', {
            phone: values.phone,
            code: values.code,
            loginType: 'sms'
          });
        }
      }

      // --- 处理成功响应 ---
      // 1. 存储 Token
      const token = res.token || res.data?.token;
      const expiresAt = res.expiresAt || res.data?.expiresAt;
      if (token) setToken({ token, expiresAt });

      // 2. 存储用户信息
      const userInfo = res.user || res.data?.user || { phone: values.phone };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      window.dispatchEvent(new Event('storage')); // 通知其他组件

      Toast.show({
        content: activeTab === 'register' ? '欢迎加入' : '欢迎回来',
        icon: 'success',
        duration: 1000
      });

      // 3. 跳转
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect') || '/';
      const targetPath = decodeURIComponent(redirectUrl);

      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 800);

    } catch (error) {
      console.error('Operation Failed:', error);
      // 错误提示由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topLine} />

        {/* 头部 Logo */}
        <div style={styles.header}>
          <div style={styles.title}>City Daily.</div>
          <div style={styles.subTitle}>Curated for you</div>
        </div>

        {/* Tab 切换：Login / Register */}
        <div style={styles.tabGroup}>
          <div
            style={{ ...styles.tabItem, ...(activeTab === 'login' ? styles.activeTab : {}) }}
            onClick={() => handleTabChange('login')}
          >
            登 录
            {activeTab === 'login' && <span style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: 'var(--c-terra)' }} />}
          </div>
          <div
            style={{ ...styles.tabItem, ...(activeTab === 'register' ? styles.activeTab : {}) }}
            onClick={() => handleTabChange('register')}
          >
            注 册
            {activeTab === 'register' && <span style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: 'var(--c-terra)' }} />}
          </div>
        </div>

        {/* 仅在登录 Tab 下显示：密码登录 vs 验证码登录 */}
        {activeTab === 'login' && (
          <div style={styles.loginTypeGroup}>
            <span
              onClick={() => setLoginType('password')}
              style={{
                ...styles.loginTypeItem,
                color: loginType === 'password' ? 'var(--c-terra)' : '#999',
                fontWeight: loginType === 'password' ? 'bold' : 'normal'
              }}
            >
              密码登录
            </span>
            <span style={{ color: '#eee' }}>|</span>
            <span
              onClick={() => setLoginType('sms')}
              style={{
                ...styles.loginTypeItem,
                color: loginType === 'sms' ? 'var(--c-terra)' : '#999',
                fontWeight: loginType === 'sms' ? 'bold' : 'normal'
              }}
            >
              验证码登录
            </span>
          </div>
        )}

        <Form
          form={form}
          onFinish={onFinish}
          style={{ '--border-top': 'none', '--border-bottom': 'none' }}
        >
          {/* 注册时显示昵称 */}
          {activeTab === 'register' && (
            <Form.Item name='nickname' rules={[{ required: true, message: '请输入昵称' }]}>
              <div className="refined-input">
                <Input placeholder='Nickname / 昵称' />
              </div>
            </Form.Item>
          )}

          {/* 手机号 (所有模式都需要) */}
          <Form.Item name='phone' rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '格式不正确' }]}>
            <div className="refined-input">
              <Input placeholder='Mobile / 手机号' />
            </div>
          </Form.Item>

          {/* 密码输入框 - 注册和密码登录时显示 */}
          {(activeTab === 'register' || loginType === 'password') && (
            <Form.Item
              name='password'
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少6位' }]}
            >
              <div className="refined-input">
                <Input placeholder='Password / 密码' type='password' />
              </div>
            </Form.Item>
          )}

          {/* 确认密码 - 仅注册时显示 */}
          {activeTab === 'register' && (
            <Form.Item
              name='confirmPassword'
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <div className="refined-input">
                <Input placeholder='Confirm Password / 确认密码' type='password' />
              </div>
            </Form.Item>
          )}

          {/* 验证码输入框 - 注册和验证码登录时显示 */}
          {(activeTab === 'register' || loginType === 'sms') && (
            <Form.Item
              name='code'
              rules={[{ required: true, message: '请输入验证码' }, { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }]}
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
          )}

          {/* 提交按钮 */}
          <Button
            block
            type='submit'
            loading={loading}
            style={{
              marginTop: '30px',
              background: 'var(--c-terra)',
              border: 'none',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '16px',
              height: '44px',
              boxShadow: '0 4px 12px rgba(160, 64, 48, 0.2)'
            }}
          >
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
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
