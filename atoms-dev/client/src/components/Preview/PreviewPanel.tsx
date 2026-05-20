import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores';
import { getBackendUrl } from '@/stores';
import { Tablet, Smartphone, RefreshCw, Monitor, FileText, ChevronDown } from 'lucide-react';

export const PreviewPanel: React.FC = () => {
  const { 
    previewUrl, 
    sandboxId, 
    files, 
    previewEntryPath, 
    setPreviewEntryPath 
  } = useProjectStore();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);
  const [showFileSelector, setShowFileSelector] = useState(false);
  
  // 当 sandboxId 变化时刷新预览
  useEffect(() => {
    setKey(k => k + 1);
  }, [sandboxId]);

  // 获取所有HTML文件用于预览选择
  const htmlFiles = files.filter(f => 
    f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
  );

  // 构造完整的预览URL
  const getFullPreviewUrl = () => {
    if (!previewUrl || !sandboxId) return null;
    
    // 如果用户选择了预览文件，直接使用该文件构造URL
    if (previewEntryPath && sandboxId) {
      return `${getBackendUrl()}/preview/${sandboxId}/${previewEntryPath}`;
    }
    
    // 否则使用默认预览URL
    return `${getBackendUrl()}${previewUrl}`;
  };

  const fullUrl = getFullPreviewUrl();

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((k) => k + 1);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleFileSelect = (filePath: string) => {
    setPreviewEntryPath(filePath);
    setShowFileSelector(false);
    // 切换文件时刷新预览
    setKey(k => k + 1);
  };

  const getDeviceStyles = () => {
    switch (device) {
      case 'tablet':
        return 'w-[768px] h-[1024px]';
      case 'mobile':
        return 'w-[375px] h-[812px]';
      default:
        return 'w-full h-full';
    }
  };

  const getFrameStyles = () => {
    switch (device) {
      case 'tablet':
        return 'rounded-2xl border-4 border-gray-700 shadow-2xl';
      case 'mobile':
        return 'rounded-[3rem] border-4 border-gray-700 shadow-2xl';
      default:
        return '';
    }
  };

  // 获取当前选择的文件名用于显示
  const getCurrentFileName = () => {
    if (!previewEntryPath) return '选择预览文件';
    const file = files.find(f => f.path === previewEntryPath);
    return file ? file.name : '选择预览文件';
  };

  return (
    <div className="relative w-full h-full bg-bg-primary flex flex-col">
      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-900">
        {fullUrl ? (
          <div className={`${getDeviceStyles()} ${getFrameStyles()} overflow-hidden bg-white`}>
            <iframe
              key={key}
              src={fullUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              title="应用预览"
            />
          </div>
        ) : (
          <div className="text-center text-text-secondary">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
              <svg
                className="w-12 h-12 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <p className="text-sm">输入需求后，预览将在这里显示</p>
          </div>
        )}
      </div>
    </div>
  );
};
