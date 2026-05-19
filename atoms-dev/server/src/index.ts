import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SocketHandler } from './websocket/SocketHandler.js';
import { chatRouter } from './routes/chat.js';
import { projectRouter } from './routes/project.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/project', projectRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 预览文件路由 - 使用服务根目录下的 atoms-sandbox
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const BASE_DIR = path.join(serverRoot, 'atoms-sandbox');

app.get('/*', (req, res) => {
  const filePath = req.path;
  // 从路径中提取 sandboxId
  const segments = filePath.split('/').filter(s => s);
  if (segments.length < 1) {
    return res.status(404).send('Not Found');
  }

  const sandboxId = segments[0];
  const relativePath = segments.slice(1).join('/') || 'index.html';
  const fullPath = path.join(BASE_DIR, sandboxId, relativePath);

  // 检查文件是否存在
  if (fs.existsSync(fullPath)) {
    // 发送文件
    res.sendFile(fullPath);
  } else {
    res.status(404).send(`File not found: ${filePath}`);
  }
});

new SocketHandler(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
});
