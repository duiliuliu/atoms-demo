import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores';
import { getUserId } from '@/utils/userId';
import { FolderOpen, Plus, Clock, Trash2, FileText } from 'lucide-react';
import { getSocket } from '@/stores';

export const ProjectList: React.FC = () => {
  const { projects, setProjectId } = useProjectStore();

  useEffect(() => {
    const socket = getSocket();
    const userId = getUserId();
    
    if (socket && userId) {
      socket.emit('project:list', { userId });
    }
  }, []);

  const handleSelectProject = (project: any) => {
    const socket = getSocket();
    const userId = getUserId();
    
    if (socket) {
      socket.emit('project:get', { projectId: project.id, userId });
    }
  };

  const handleCreateProject = () => {
    const socket = getSocket();
    const userId = getUserId();
    
    if (socket && userId) {
      socket.emit('project:create', { userId, name: '新项目' });
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const socket = getSocket();
    const userId = getUserId();
    
    if (socket && userId) {
      socket.emit('project:delete', { projectId, userId });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            项目列表
          </span>
        </div>
        <button
          onClick={handleCreateProject}
          className="p-1.5 hover:bg-bg-tertiary rounded-md transition flex items-center gap-1 text-xs text-text-secondary hover:text-white"
          title="创建新项目"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="space-y-1.5">
        {projects.length === 0 ? (
          <div className="p-3 text-xs text-text-muted text-center">
            <div className="mb-2">还没有项目</div>
          </div>
        ) : (
          projects.map((project) => {
            const currentProjectId = useProjectStore.getState().projectId;
            const isActive = currentProjectId === project.id;
            return (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className={`
                  w-full p-2.5 rounded-lg text-left transition
                  ${isActive 
                    ? 'bg-primary/20 border border-primary/30 text-white'
                    : 'hover:bg-bg-tertiary text-text-secondary hover:text-white'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[10px] text-text-muted">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-0.5 hover:text-red-400 hover:bg-red-400/10 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
