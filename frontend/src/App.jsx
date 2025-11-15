import { useEffect, useState } from 'react';
import { Button, List } from 'antd-mobile';

export default function App() {
  const [posts, setPosts] = useState([]);

  // 获取占位 Feed 列表
  const fetchPosts = () => {
    fetch('http://localhost:3000/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <h1>Feed 列表占位</h1>
      <Button color="primary" onClick={fetchPosts}>刷新列表</Button>
      <List>
        {posts.map(post => (
          <List.Item key={post.id}>
            <b>{post.author}</b>: {post.content} <br />
            <small>{post.createdAt}</small>
          </List.Item>
        ))}
      </List>
    </div>
  );
}
