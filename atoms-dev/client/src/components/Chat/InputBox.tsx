import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useChatStore } from '@/stores';
import { Tooltip } from '@/components/Layout/Tooltip';

export const InputBox: React.FC = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useChatStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholder = isLoading
    ? 'AI 正在处理中...'
    : '描述你想要创建的应用...';

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Tooltip text="添加文件（暂不支持）">
        <button
          type="button"
          className="p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition cursor-not-allowed opacity-50"
          disabled
        >
          <Paperclip className="w-5 h-5 text-text-secondary" />
        </button>
      </Tooltip>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="
          flex-1 px-4 py-3 rounded-xl
          bg-bg-tertiary border border-border-color
          text-white placeholder-text-muted
          focus:outline-none focus:border-primary
          transition disabled:opacity-50
        "
      />

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="
          px-6 py-3 rounded-xl
          bg-primary hover:bg-primary-hover
          text-white font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          transition flex items-center gap-2
        "
      >
        <Send className="w-5 h-5" />
        <span className="hidden sm:inline">发送</span>
      </button>
    </form>
  );
};
