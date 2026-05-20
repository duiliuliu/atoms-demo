import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore, getSocket } from '@/stores';
import { FileCode, FolderOpen, Save, Check, AlertCircle } from 'lucide-react';

export const CodeEditor: React.FC = () => {
  const { files, activeFile, setActiveFile, updateFile, setPreviewUrl, sandboxId } = useProjectStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleEditorChange = (value: string | undefined) => {
    if (value && activeFile) {
      updateFile(activeFile.path, value);
      setSaveStatus('idle');
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;

    setIsSaving(true);
    const socket = getSocket();

    try {
      await new Promise<void>((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit('file:update', { path: activeFile.path, content: activeFile.content }, (error?: string) => {
          if (error) {
            reject(new Error(error));
          } else {
            resolve();
          }
        });
      });

      if (sandboxId) {
        const previewUrl = `/preview/${sandboxId}/${activeFile.path}`;
        setPreviewUrl(previewUrl);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      html: 'html',
      htm: 'html',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  if (files.length === 0) {
    return (
      <div className="w-full h-full bg-bg-primary flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <FileCode className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <p className="text-sm">暂无文件</p>
          <p className="text-xs text-text-muted mt-1">
            输入需求后，代码将显示在这里
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-bg-primary">
      {/* File Tree */}
      <div className="w-48 bg-bg-secondary border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-text-secondary" />
            <span className="text-xs text-text-secondary uppercase font-medium">
              文件
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!activeFile || isSaving}
            className={`
              p-1 rounded transition flex items-center gap-1
              ${activeFile && !isSaving 
                ? 'hover:bg-bg-tertiary text-text-secondary hover:text-white' 
                : 'opacity-50 cursor-not-allowed text-text-muted'
              }
            `}
            title="保存文件"
          >
            {isSaving ? (
              <Save className="w-3 h-3 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-3 h-3 text-red-400" />
            ) : (
              <Save className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setActiveFile(file.path)}
              className={`
                w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition
                ${
                  activeFile?.path === file.path
                    ? 'bg-primary text-white'
                    : 'hover:bg-bg-tertiary text-text-secondary hover:text-white'
                }
              `}
            >
              <FileCode className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeFile && (
          <div className="h-6 bg-bg-secondary border-b border-border flex items-center justify-between px-3">
            <span className="text-xs text-text-secondary">{activeFile.name}</span>
            <button
              onClick={handleSave}
              disabled={!activeFile || isSaving}
              className={`
                px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1
                ${activeFile && !isSaving 
                  ? 'bg-primary hover:bg-primary/80 text-white' 
                  : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                }
              `}
            >
              {isSaving ? (
                <>
                  <Save className="w-3 h-3 animate-spin" />
                  <span>保存中...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>已保存</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <Editor
              height="100%"
              language={getLanguage(activeFile.name)}
              value={activeFile.content}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16 },
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">
              <p className="text-sm">选择一个文件查看</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
