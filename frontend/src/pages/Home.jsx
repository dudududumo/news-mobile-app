import React from 'react';
import { Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../services/axios';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'var(--c-bg)',
  },
  welcomeCard: {
    width: '100%',
    maxWidth: '400px',
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(62, 58, 57, 0.08)',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: 'var(--c-text)',
    fontFamily: 'var(--font-serif)',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  logoutButton: {
    backgroundColor: 'var(--c-terra)',
    border: 'none',
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logoutButtonHover: {
    opacity: 0.9,
  },
};

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    Toast.show({ content: '已退出登录', icon: 'success' });
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.welcomeCard}>
        <h1 style={styles.title}>欢迎回来！</h1>
        <p style={styles.subtitle}>您已成功登录到City Daily</p>
        
        <div style={{ marginTop: '30px' }}>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '30px' }}>
            这是一个受保护的页面，只有登录用户才能访问
          </p>
          
          <Button
            onClick={handleLogout}
            style={styles.logoutButton}
            activeStyle={styles.logoutButtonHover}
          >
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;