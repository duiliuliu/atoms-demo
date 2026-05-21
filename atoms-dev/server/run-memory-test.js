#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 启动增强记忆系统测试...\n');

try {
  const testModule = await import('./dist/src/test/memory-test.js');
  await testModule.main();
} catch (error) {
  console.error('❌ 测试运行失败:', error);
  process.exit(1);
}
