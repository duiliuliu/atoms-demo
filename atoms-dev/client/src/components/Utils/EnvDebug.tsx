import React from 'react';

export const EnvDebug: React.FC = () => {
  const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'Not set';
  const isDev = (import.meta as any).env.DEV;
  const isProd = (import.meta as any).env.PROD;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2 text-green-400">🌍 环境变量</h3>
      <div className="space-y-1">
        <p><span className="text-gray-400">VITE_BACKEND_URL:</span> <span className="text-yellow-400">{backendUrl}</span></p>
        <p><span className="text-gray-400">DEV:</span> <span className={isDev ? 'text-blue-400' : 'text-gray-500'}>{String(isDev)}</span></p>
        <p><span className="text-gray-400">PROD:</span> <span className={isProd ? 'text-blue-400' : 'text-gray-500'}>{String(isProd)}</span></p>
      </div>
    </div>
  );
};
