import React from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '@/stores';
import { FileCode, FolderOpen } from 'lucide-react';

export const CodeEditor: React.FC = () => {
  const { files, activeFile, setActiveFile, updateFile } = useProjectStore();

  const handleEditorChange = (value: string | undefined) => {
    if (value && activeFile) {
      updateFile(activeFile.path, value);
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
        <div className="p-3 border-b border-border flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary uppercase font-medium">
            文件
          </span>
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
      <div className="flex-1">
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
  );
};
