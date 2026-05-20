import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Code } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  output?: string;
}

interface TaskExecutionListProps {
  tasks: Task[];
}

export const TaskExecutionList: React.FC<TaskExecutionListProps> = ({ tasks }) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-border mb-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Code className="w-5 h-5 text-accent" />
        任务执行
      </h3>
      <div className="space-y-3">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="border border-border rounded-lg overflow-hidden bg-bg-tertiary"
          >
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-bg-quaternary transition-colors"
              onClick={() => toggleTaskExpand(task.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(task.status)}
                <span className={`font-medium ${
                  task.status === 'completed' 
                    ? 'text-green-400' 
                    : task.status === 'in_progress' 
                    ? 'text-yellow-400' 
                    : task.status === 'failed' 
                    ? 'text-red-400' 
                    : 'text-gray-300'
                }`}>
                  {task.description}
                </span>
              </div>
              {task.output && (
                <div className="text-text-muted">
                  {expandedTasks.has(task.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>
            
            {expandedTasks.has(task.id) && task.output && (
              <div className="border-t border-border">
                <div className="p-3 bg-black/30 font-mono text-xs text-green-300 whitespace-pre-wrap overflow-x-auto">
                  {task.output}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
