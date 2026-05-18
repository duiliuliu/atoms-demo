import { Bot, User } from 'lucide-react';
import { Message } from '@/types';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const segments: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
    let codeIndex = 0;
    let codeMatch;

    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      if (codeMatch.index > codeIndex) {
        segments.push({
          type: 'text',
          content: content.slice(codeIndex, codeMatch.index),
        });
      }
      segments.push({
        type: 'code',
        content: codeMatch[2] || codeMatch[0],
        lang: codeMatch[1],
      });
      codeIndex = codeMatch.index + codeMatch[0].length;
    }

    if (codeIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(codeIndex),
      });
    }

    if (segments.length === 0) {
      segments.push({ type: 'text', content });
    }

    return segments.map((seg, i) => {
      if (seg.type === 'code') {
        return (
          <pre key={i} className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-sm font-mono text-green-400">{seg.content}</code>
          </pre>
        );
      }
      
      const textParts: React.ReactNode[] = [];
      let text = seg.content;
      let inlineMatch;
      let inlineIndex = 0;
      
      while ((inlineMatch = inlineCodeRegex.exec(text)) !== null) {
        if (inlineMatch.index > inlineIndex) {
          textParts.push(text.slice(inlineIndex, inlineMatch.index));
        }
        textParts.push(
          <code key={inlineIndex} className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-green-400">
            {inlineMatch[1]}
          </code>
        );
        inlineIndex = inlineMatch.index + inlineMatch[0].length;
      }
      
      if (inlineIndex < text.length) {
        textParts.push(text.slice(inlineIndex));
      }

      return <span key={i}>{textParts.length > 0 ? textParts : text}</span>;
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-bg-secondary text-white rounded-bl-md'
          }
        `}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-xs text-text-secondary">AI 助手</span>
          </div>
        )}

        <div className="message-content text-sm leading-relaxed">
          {formatContent(message.content)}
        </div>

        <div className={`mt-2 text-xs ${isUser ? 'text-white/60' : 'text-text-muted'}`}>
          {isUser && <User className="w-3 h-3 inline mr-1" />}
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
