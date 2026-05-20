import React from 'react';
import { Eye, Code, Terminal, ChevronDown } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
  showTerminalToggle?: boolean;
  isTerminalExpanded?: boolean;
  onTerminalToggle?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  tabs,
  showTerminalToggle = false,
  isTerminalExpanded = false,
  onTerminalToggle
}) => {
  return (
    <div className="flex items-center justify-between h-8 bg-bg-tertiary border-b border-border px-3">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition
              ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-white hover:bg-bg-quaternary'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {showTerminalToggle && onTerminalToggle && (
        <button
          onClick={onTerminalToggle}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition
            ${
              isTerminalExpanded
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-white hover:bg-bg-quaternary'
            }
          `}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>终端</span>
          <ChevronDown 
            className={`w-3 h-3 transition-transform ${isTerminalExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
      )}
    </div>
  );
};

export const PreviewCodeTabBar: React.FC<{
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    {
      id: 'preview',
      label: '预览',
      icon: <Eye className="w-3.5 h-3.5" />
    },
    {
      id: 'code',
      label: '代码',
      icon: <Code className="w-3.5 h-3.5" />
    }
  ];

  return (
    <TabBar
      activeTab={activeTab}
      onTabChange={onTabChange}
      tabs={tabs}
    />
  );
};
