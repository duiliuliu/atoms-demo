import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getSandboxBaseDir, getEnv, isProduction, isRender } from './config/env.js';
import { SocketHandler } from './websocket/SocketHandler.js';
import { chatRouter } from './routes/chat.js';
import { projectRouter } from './routes/project.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS 配置 - 支持 Render 部署
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins: (string | RegExp)[] = [
      getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    ];
    if (isRender()) {
      allowedOrigins.push(/.*\.onrender\.com/);
      allowedOrigins.push(/https?:\/\/(.*\.vercel\.app)/);
    }
    if (!origin || allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      } else {
        return pattern.test(origin);
      }
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/project', projectRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: isProduction() ? 'production' : 'development',
    platform: isRender() ? 'render' : 'local',
  });
});

const BASE_DIR = getSandboxBaseDir();

// 预览路由 - 处理 /preview/:sandboxId/* 格式的请求
app.get('/preview/:sandboxId/*', (req, res) => {
  const { sandboxId } = req.params;
  const wildcard = (req.params as Record<string, string>)[0];
  const relativePath = wildcard || 'index.html';
  const fullPath = path.join(BASE_DIR, sandboxId, relativePath);

  if (fs.existsSync(fullPath)) {
    res.sendFile(fullPath);
  } else {
    res.status(404).send(`File not found: ${sandboxId}/${relativePath}`);
  }
});

// 预览路由 - 处理 /preview/:sandboxId 格式的请求（不带通配符）
app.get('/preview/:sandboxId', (req, res) => {
  const { sandboxId } = req.params;
  const fullPath = path.join(BASE_DIR, sandboxId, 'index.html');

  if (fs.existsSync(fullPath)) {
    res.sendFile(fullPath);
  } else {
    res.status(404).send(`File not found: ${sandboxId}/index.html`);
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins: (string | RegExp)[] = [
        getEnv('CORS_ORIGIN', 'http://localhost:5173'),
      ];
      if (isRender()) {
        allowedOrigins.push(/.*\.onrender\.com/);
        allowedOrigins.push(/https?:\/\/(.*\.vercel\.app)/);
      }
      if (!origin || allowedOrigins.some(pattern => {
        if (typeof pattern === 'string') {
          return origin === pattern;
        } else {
          return pattern.test(origin);
        }
      })) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

new SocketHandler(io);

const PORT = parseInt(getEnv('PORT', '3001'));

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${isProduction() ? 'Production' : 'Development'}`);
  console.log(`💾 Sandbox dir: ${BASE_DIR}`);
  console.log(`📡 WebSocket ready for connections`);
});
