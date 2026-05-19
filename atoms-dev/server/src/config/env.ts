/**
 * 获取环境变量
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  return process.env[key] || defaultValue || '';
};

/**
 * 检测是否为生产环境
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
};

/**
 * 检测是否为 Render 环境
 */
export const isRender = (): boolean => {
  return process.env.RENDER === 'true';
};

/**
 * 获取沙箱目录路径
 * 生产环境: /tmp/atoms-sandbox
 * 开发环境: 项目根目录下
 */
export const getSandboxBaseDir = (): string => {
  if (isProduction()) {
    // 生产环境使用 /tmp 目录
    return '/tmp/atoms-sandbox';
  }
  // 开发环境使用项目根目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverRoot = path.resolve(__dirname, '../../..');
  return path.join(serverRoot, 'atoms-sandbox');
};

// 避免循环引用，单独导入需要的模块
import { fileURLToPath } from 'url';
import path from 'path';
