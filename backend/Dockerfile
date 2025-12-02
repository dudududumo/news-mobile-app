# 使用官方 Node.js 16 镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY src/ ./src/
COPY api/ ./api/
COPY 404.html ./

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "src/index.js"]