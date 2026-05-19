/**
 * ==========================================
 * 环境配置 - 优化版
 * ==========================================
 *
 * 环境优先级（从高到低）:
 * 1. MODE 环境变量 (推荐)
 * 2. NODE_ENV 环境变量
 * 3. 平台特有检测 (RENDER, VERCEL 等)
 *
 * 使用方式:
 * - 开发: npm run dev (默认 MODE=development)
 * - 生产: npm start (默认 MODE=production)
 * - 显式指定: MODE=staging npm start
 * ==========================================
 */

export type EnvironmentMode = 'development' | 'staging' | 'production';

/**
 * 获取运行模式
 * 优先级: MODE > NODE_ENV > 平台检测 > 默认 'development'
 */
export const getMode = (): EnvironmentMode => {
  const mode = process.env.MODE || process.env.NODE_ENV;

  if (mode === 'production') return 'production';
  if (mode === 'staging') return 'staging';
  if (mode === 'development') return 'development';

  // 如果没有显式设置，通过平台检测
  if (isRender() || isVercel()) {
    return 'production';
  }

  // 默认开发模式
  return 'development';
};

/**
 * 检测是否为生产环境
 */
export const isProduction = (): boolean => {
  return getMode() === 'production';
};

/**
 * 检测是否为开发环境
 */
export const isDevelopment = (): boolean => {
  return getMode() === 'development';
};

/**
 * 检测是否为 Staging 环境
 */
export const isStaging = (): boolean => {
  return getMode() === 'staging';
};

/**
 * 检测是否为 Render 环境 (平台检测)
 */
export const isRender = (): boolean => {
  return process.env.RENDER === 'true';
};

/**
 * 检测是否为 Vercel 环境 (平台检测)
 */
export const isVercel = (): boolean => {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
};

/**
 * 获取沙箱目录路径
 */
export const getSandboxBaseDir = (): string => {
  if (isProduction()) {
    return '/tmp/atoms-sandbox';
  }
  // 开发或 Staging 使用项目根目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverRoot = path.resolve(__dirname, '../../..');
  return path.join(serverRoot, 'atoms-sandbox');
};

/**
 * 获取环境变量，带类型安全
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  return process.env[key] ?? defaultValue ?? '';
};

/**
 * 获取环境变量并转换为布尔值
 */
export const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return ['1', 'true', 'yes'].includes(value.toLowerCase());
};

/**
 * 打印启动信息 - 调试用
 */
export const printStartupInfo = (): void => {
  console.log('='.repeat(60));
  console.log('📦 Atoms.dev Server');
  console.log('='.repeat(60));
  console.log(`🎯 Mode: ${getMode()}`);
  console.log(`🏠 Platform: ${isRender() ? 'Render' : isVercel() ? 'Vercel' : 'Local'}`);
  console.log(`💾 Sandbox Dir: ${getSandboxBaseDir()}`);
  console.log('='.repeat(60));
};

// 模块初始化时自动打印启动信息
printStartupInfo();

// 避免循环引用，单独导入
import { fileURLToPath } from 'url';
import path from 'path';
