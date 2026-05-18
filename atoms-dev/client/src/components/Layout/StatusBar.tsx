import React from 'react';
import { useStatusStore, useProjectStore, useUIStore } from '@/stores';

export const StatusBar: React.FC = () => {
  const { currentStatus } = useStatusStore();
  const { sandboxId, files } = useProjectStore();
  const { currentProvider } = useUIStore();

  const getStatusColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'text-accent';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className="h-6 bg-bg-secondary border-t border-border flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        {currentStatus && (
          <span className={getStatusColor(currentStatus.type)}>
            {currentStatus.type === 'info' && '⚙️ '}
            {currentStatus.type === 'success' && '✅ '}
            {currentStatus.type === 'warning' && '⚠️ '}
            {currentStatus.type === 'error' && '❌ '}
            {currentStatus.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-text-secondary">
        {sandboxId && (
          <span>🔧 Sandbox: {sandboxId.substring(0, 8)}...</span>
        )}
        {files.length > 0 && (
          <span>📁 {files.length} 文件</span>
        )}
        <span>
          {currentProvider === 'deepseek' ? '🔵 DeepSeek' : '🟢 智谱AI'}
        </span>
      </div>
    </div>
  );
};
