import React, { useState } from 'react';
import { User, Bot, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Code } from 'lucide-react';
import { EnhancedMessage } from '@/types';

interface MessageBubbleProps {
  message: EnhancedMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [expanded, setExpanded] = useState(true);

  // 渲染任务执行卡片
  const renderTaskExecution = () => {
    if (!message.taskExecution) return null;
    const { tasks, currentBatch, totalBatches, isComplete } = message.taskExecution;
    
    return (
      <div className="bg-bg-secondary rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white">
              任务执行 {isComplete ? '(完成)' : `(${currentBatch + 1}/${totalBatches})`}
            </h3>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-text-muted hover:text-white transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        {expanded && (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="border border-border rounded-lg p-3 bg-bg-tertiary hover:bg-bg-quaternary transition-colors">
                <div className="flex items-center gap-3">
                  {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {task.status === 'in_progress' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse flex-shrink-0" />}
                  {task.status === 'pending' && <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  {task.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                  <span className={`font-medium text-sm ${
                    task.status === 'completed' ? 'text-green-400' :
                    task.status === 'in_progress' ? 'text-yellow-400' :
                    task.status === 'failed' ? 'text-red-400' :
                    'text-gray-300'
                  }`}>
                    {task.description}
                  </span>
                </div>
                {task.output && (
                  <div className="mt-2 pl-8 text-xs text-text-muted font-mono whitespace-pre-wrap bg-black/20 rounded p-2">
                    {task.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染任务分解卡片
  const renderTaskBreakdown = () => {
    if (!message.taskBreakdown) return null;
    
    return (
      <div className="bg-bg-secondary rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">任务规划</h3>
        </div>
        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl w-full ${isUser ? 'pl-12' : 'pr-12'}`}>
        <div className="flex items-start gap-3">
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-accent" />
            </div>
          )}
          
          <div className="flex-1">
            {message.type === 'task_execution' ? (
              renderTaskExecution()
            ) : message.type === 'task_breakdown' ? (
              renderTaskBreakdown()
            ) : (
              <div className={`
                rounded-2xl px-4 py-3
                ${isUser 
                  ? 'bg-primary text-white' 
                  : 'bg-bg-secondary text-white border border-border'
                }
              `}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            )}
          </div>
          
          {isUser && (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
