import React from 'react';
import { Eye, Code, Terminal } from 'lucide-react';
import { useUIStore } from '@/stores';
import { TabType } from '@/types';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'preview', label: '预览', icon: <Eye className="w-4 h-4" /> },
  { id: 'code', label: '代码', icon: <Code className="w-4 h-4" /> },
  { id: 'terminal', label: '终端', icon: <Terminal className="w-4 h-4" /> },
];

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm transition
            ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
