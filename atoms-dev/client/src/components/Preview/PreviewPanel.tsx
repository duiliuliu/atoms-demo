import { useState } from 'react';
import { useProjectStore } from '@/stores';
import { getBackendUrl } from '@/stores';
import { Tablet, Smartphone, RefreshCw, Monitor } from 'lucide-react';

export const PreviewPanel: React.FC = () => {
  const { previewUrl } = useProjectStore();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((k) => k + 1);
    setTimeout(() => setIsLoading(false), 500);
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

  const fullUrl = previewUrl ? `${getBackendUrl()}${previewUrl}` : null;

  return (
    <div className="relative w-full h-full bg-bg-primary flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-bg-secondary border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-text-secondary ml-2">
            {previewUrl ? '预览' : '等待生成...'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Device selector */}
          <div className="flex bg-bg-tertiary rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded ${device === 'desktop' ? 'bg-primary' : ''}`}
              title="桌面"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded ${device === 'tablet' ? 'bg-primary' : ''}`}
              title="平板"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded ${device === 'mobile' ? 'bg-primary' : ''}`}
              title="手机"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-bg-tertiary rounded transition"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
