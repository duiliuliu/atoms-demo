import React, { useRef, useEffect } from 'react';
import { useChatStore, useTaskStore } from '@/stores';
import { MessageBubble } from './MessageBubble';
import { InputBox } from './InputBox';
import { TaskConfirmation } from './TaskConfirmation';
import { Bot } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const { messages, isLoading } = useChatStore();
  const { currentBreakdown } = useTaskStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !currentBreakdown && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              欢迎使用 Atoms.dev
            </h2>
            <p className="text-text-secondary max-w-md">
              描述你想要创建的应用，AI 将自动为你生成代码并实时预览
            </p>
            <div className="mt-6 text-sm text-text-muted space-y-2">
              <p>💡 试试这些例子：</p>
              <div className="space-y-1 text-left max-w-sm mx-auto">
                <p className="text-accent">• 创建一个待办事项应用</p>
                <p className="text-accent">• 做一个计算器</p>
                <p className="text-accent">• 做一个天气查询网页</p>
              </div>
            </div>
          </div>
        )}

        {currentBreakdown && <TaskConfirmation />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && messages.length > 0 && !currentBreakdown && (
          <div className="flex items-center gap-2 text-text-secondary animate-fadeIn">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">AI 正在思考...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <InputBox />
      </div>
    </div>
  );
};
