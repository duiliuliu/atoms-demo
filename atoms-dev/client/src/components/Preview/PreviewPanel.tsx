import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores';
import { getBackendUrl } from '@/stores';

export const PreviewPanel: React.FC = () => {
  const { previewUrl, sandboxId, previewEntryPath } = useProjectStore();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [sandboxId]);

  const getFullPreviewUrl = () => {
    if (!previewUrl || !sandboxId) return null;
    
    if (previewEntryPath && sandboxId) {
      return `${getBackendUrl()}/preview/${sandboxId}/${previewEntryPath}`;
    }
    
    return `${getBackendUrl()}${previewUrl}`;
  };

  const fullUrl = getFullPreviewUrl();

  return (
    <div className="relative w-full h-full bg-bg-primary flex flex-col">
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-900">
        {fullUrl ? (
          <div className="w-full h-full overflow-hidden">
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
