import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/stores';
import { getUserId } from '@/utils/userId';
import { getSocket } from '@/stores';
import { FolderOpen, Folder, Plus, Trash2, FileText, Clock, ChevronRight, ChevronDown, Edit3, Check, X, MessageSquare, File, Folder as FolderIcon } from 'lucide-react';

interface ProjectItem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages?: Array<{ id: string; role: string; content: string; timestamp: number }>;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
}

export const Sidebar: React.FC = () => {
  const { projects, files, setProjectId, setFiles, setSandboxId, setPreviewUrl, projectId: activeProjectId, setPreviewEntryPath } = useProjectStore();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const socket = getSocket();
    const userId = getUserId();
    
    if (socket && userId) {
      socket.emit('project:list', { userId });
    }
  }, []);

  const toggleExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleSelectProject = (project: ProjectItem) => {
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

  const startEdit = (project: ProjectItem) => {
    setEditingProject(project.id);
    setEditValue(project.name);
  };

  const saveEdit = () => {
    if (editingProject && editValue.trim()) {
      const socket = getSocket();
      const userId = getUserId();
      
      if (socket && userId) {
        socket.emit('project:rename', { projectId: editingProject, userId, name: editValue.trim() });
      }
    }
    setEditingProject(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setEditValue('');
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
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getRecentMessages = (project: ProjectItem) => {
    if (!project.messages || project.messages.length === 0) return [];
    return project.messages.slice(-5).reverse();
  };

  const buildFileTree = (files: any[]): TreeNode[] => {
    const root: TreeNode = { name: 'root', path: '', isDirectory: true, children: [] };
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const fullPath = parts.slice(0, index + 1).join('/');
        
        let child = current.children.find(c => c.name === part);
        if (!child) {
          child = { name: part, path: fullPath, isDirectory: !isLast, children: [] };
          current.children.push(child);
        }
        current = child;
      });
    });
    
    return root.children.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
      return a.isDirectory ? -1 : 1;
    });
  };

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  const toggleFileExpand = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const handleSelectFile = (file: any) => {
    setPreviewEntryPath(file.path);
  };

  const renderFileTree = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => {
            if (node.isDirectory) {
              toggleFileExpand(node.path);
            } else {
              const file = files.find(f => f.path === node.path);
              if (file) handleSelectFile(file);
            }
          }}
          className="w-full px-2 py-1 text-left text-xs flex items-center gap-1 hover:bg-bg-tertiary rounded transition"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.isDirectory ? (
            <>
              {node.children.length > 0 && (
                expandedFiles.has(node.path) ? (
                  <ChevronDown className="w-3 h-3 text-text-muted" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-text-muted" />
                )
              )}
              <FolderIcon className="w-3 h-3 text-yellow-400" />
            </>
          ) : (
            <>
              <span className="w-3" />
              <File className="w-3 h-3 text-text-secondary" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.isDirectory && expandedFiles.has(node.path) && node.children.length > 0 && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-full bg-bg-secondary border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">项目列表</span>
          </div>
          <button
            onClick={handleCreateProject}
            className="p-1.5 hover:bg-bg-tertiary rounded-md transition flex items-center gap-1 text-xs text-text-secondary hover:text-white"
            title="创建新项目"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-xs">
            还没有项目
          </div>
        ) : (
          projects.map((project: ProjectItem) => {
            const isExpanded = expandedProjects.has(project.id);
            const isEditing = editingProject === project.id;
            const currentProjectId = useProjectStore.getState().projectId;
            const isActive = currentProjectId === project.id;
            const recentMessages = getRecentMessages(project);

            return (
              <div key={project.id} className="mb-1">
                {/* Project Header */}
                <button
                  onClick={() => handleSelectProject(project)}
                  className={`
                    w-full p-2.5 rounded-lg text-left transition flex items-center gap-2
                    ${isActive 
                      ? 'bg-primary/20 border border-primary/30 text-white'
                      : 'hover:bg-bg-tertiary text-text-secondary hover:text-white'
                    }
                  `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(project.id);
                    }}
                    className="p-0.5 hover:bg-bg-quaternary rounded transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-bg-quaternary border border-primary rounded px-2 py-1 text-xs outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                        className="p-0.5 hover:bg-green-500/20 rounded"
                      >
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                        className="p-0.5 hover:bg-red-500/20 rounded"
                      >
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{project.name}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(project); }}
                              className="p-0.5 hover:bg-blue-500/20 rounded transition text-blue-400 hover:text-blue-300"
                              title="编辑项目名称"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(e, project.id)}
                              className="p-0.5 hover:bg-red-500/20 rounded transition text-red-400 hover:text-red-300"
                              title="删除项目"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[10px] text-text-muted">
                            {formatDate(project.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </button>

                {/* Expanded Content - Recent Messages & Files */}
                {isExpanded && !isEditing && (
                  <div className="ml-6 mt-1 mb-1 space-y-2">
                    {/* Files Section */}
                    {files.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5" />
                          文件
                        </div>
                        <div className="mt-1 max-h-40 overflow-y-auto">
                          {renderFileTree(fileTree)}
                        </div>
                      </div>
                    )}
                    
                    {/* Recent Messages Section */}
                    {recentMessages.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" />
                          最近会话
                        </div>
                        {recentMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`
                              px-2 py-1.5 rounded text-xs truncate
                              ${msg.role === 'user' ? 'bg-bg-tertiary text-text-secondary' : 'bg-primary/10 text-text-muted'}
                            `}
                          >
                            <span className="font-medium text-[10px] mr-1">
                              {msg.role === 'user' ? '你' : 'AI'}:
                            </span>
                            {msg.content.substring(0, 50)}{msg.content.length > 50 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
