import React from 'react';
import { useTaskStore } from '@/stores';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

export const TaskConfirmation: React.FC = () => {
  const { currentBreakdown, confirmTasks, cancelTasks } = useTaskStore();

  if (!currentBreakdown) return null;

  return (
    <div className="p-4 bg-bg-secondary rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            <CheckCircle className="inline-block w-5 h-5 text-accent mr-2" />
            分析完成
          </h3>
          <p className="text-text-secondary text-sm">
            AI 已理解您的需求，请确认后开始执行
          </p>
        </div>
        <button
          onClick={cancelTasks}
          className="p-1 hover:bg-bg-tertiary rounded-lg transition text-text-muted hover:text-red-400"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
        <div className="text-sm text-text-muted mb-1">目标</div>
        <div className="text-white">
          {currentBreakdown.userIntent.understoodGoal}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-text-muted mb-2">技术栈</div>
        <div className="flex flex-wrap gap-2">
          {currentBreakdown.userIntent.techStack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-xs bg-primary/20 text-primary rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-text-muted mb-2">核心功能</div>
        <ul className="space-y-1">
          {currentBreakdown.userIntent.keyFeatures.map((feature, idx) => (
            <li
              key={idx}
              className="text-sm text-white flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <div className="text-sm text-text-muted mb-2">执行计划</div>
        <div className="space-y-2">
          {currentBreakdown.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-2 p-2 bg-bg-tertiary rounded-lg"
            >
              <Clock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-white">{task.description}</div>
                <div className="text-xs text-text-muted">
                  {task.files.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentBreakdown.userIntent.potentialIssues &&
        currentBreakdown.userIntent.potentialIssues.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">注意事项</span>
            </div>
            <ul className="space-y-1">
              {currentBreakdown.userIntent.potentialIssues.map((issue, idx) => (
                <li
                  key={idx}
                  className="text-sm text-yellow-500/80"
                >
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

      <div className="flex gap-3">
        <button
          onClick={cancelTasks}
          className="flex-1 py-3 px-4 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-secondary rounded-xl font-medium transition border border-border"
        >
          取消
        </button>
        <button
          onClick={confirmTasks}
          className="flex-1 py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition"
        >
          确认执行
        </button>
      </div>
    </div>
  );
};
