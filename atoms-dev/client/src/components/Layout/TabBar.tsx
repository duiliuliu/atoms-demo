import React from 'react';
import { Eye, Code, Terminal, FolderOpen } from 'lucide-react';
import { useUIStore } from '@/stores';
import { TabType } from '@/types';

const tabs: { id: TabType | 'projects'; label: string; icon: React.ReactNode }[] = [
  { id: 'preview', label: '预览', icon: <Eye className="w-4 h-4" /> },
  { id: 'code', label: '代码', icon: <Code className="w-4 h-4" /> },
  { id: 'terminal', label: '终端', icon: <Terminal className="w-4 h-4" /> },
  { id: 'projects', label: '项目', icon: <FolderOpen className="w-4 h-4" /> },
];

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  const handleTabClick = (tabId: TabType | 'projects') => {
    if (tabId === 'projects') {
      setActiveTab('preview');
      const event = new CustomEvent('toggle-project-panel', { detail: { show: true } });
      window.dispatchEvent(event);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="h-10 bg-bg-secondary border-b border-border flex items-center px-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
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
