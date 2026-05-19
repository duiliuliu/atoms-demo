import React from 'react';
import { Bot, Github } from 'lucide-react';
import { useUIStore, switchLLMProvider } from '@/stores';
import { LLMProvider } from '@/types';

export const Header: React.FC = () => {
  const { currentProvider, setShowProviderMenu, showProviderMenu } = useUIStore();

  const handleProviderChange = (provider: LLMProvider) => {
    switchLLMProvider(provider);
    setShowProviderMenu(false);
  };

  return (
    <header className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-7 h-7 text-primary" />
          <span className="text-lg font-semibold text-white">Atoms.dev</span>
        </div>
        <span className="text-xs text-text-secondary bg-bg-tertiary px-2 py-1 rounded">
          AI 应用生成
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* AI Provider Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProviderMenu(!showProviderMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary hover:bg-border rounded-lg transition"
          >
            <span className="text-sm">
              {currentProvider === 'deepseek' ? '🔵 DeepSeek' : '🟢 智谱AI'}
            </span>
            <span className="text-xs text-text-secondary">▼</span>
          </button>

          {showProviderMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProviderMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-tertiary border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => handleProviderChange('deepseek')}
                  className={`w-full px-4 py-3 text-left hover:bg-border transition flex items-center gap-3 ${
                    currentProvider === 'deepseek' ? 'bg-primary/20' : ''
                  }`}
                >
                  <span className="text-lg">🔵</span>
                  <div>
                    <div className="text-sm font-medium">DeepSeek</div>
                    <div className="text-xs text-text-secondary">强大的代码生成能力</div>
                  </div>
                </button>
                <button
                  onClick={() => handleProviderChange('zhipu')}
                  className={`w-full px-4 py-3 text-left hover:bg-border transition flex items-center gap-3 ${
                    currentProvider === 'zhipu' ? 'bg-primary/20' : ''
                  }`}
                >
                  <span className="text-lg">🟢</span>
                  <div>
                    <div className="text-sm font-medium">智谱AI</div>
                    <div className="text-xs text-text-secondary">GLM-4 高性能模型</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-bg-tertiary rounded-lg transition"
        >
          <Github className="w-5 h-5 text-text-secondary" />
        </a>
      </div>
    </header>
  );
};
