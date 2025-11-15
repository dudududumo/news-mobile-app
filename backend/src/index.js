// backend/src/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 连接
mongoose.connect('mongodb://localhost:27017/news_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// 占位 API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});
// 假用户列表
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ]);
});

// 假 Feed 列表
app.get('/api/posts', (req, res) => {
  res.json([
    { id: 1, author: 'Alice', content: 'Hello world!', createdAt: '2025-11-15' },
    { id: 2, author: 'Bob', content: 'My first post!', createdAt: '2025-11-14' }
  ]);
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
