import { useEffect, useState, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Layout/Header';
import { ChatContainer } from './components/Chat/ChatContainer';
import { PreviewPanel } from './components/Preview/PreviewPanel';
import { CodeEditor } from './components/Editor/CodeEditor';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { StatusBar } from './components/Layout/StatusBar';
import { Sidebar } from './components/Layout/Sidebar';
import { PreviewCodeTabBar } from './components/Layout/TabBar';
import { initSocket } from './stores';

function App() {
  useEffect(() => {
    initSocket();
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(150);

  // 使用 key 来强制重新渲染 PanelGroup，解决折叠后空白问题
  const panelGroupKey = useMemo(() => `panel-group-${sidebarCollapsed ? 'collapsed' : 'expanded'}`, [sidebarCollapsed]);

  const handleTerminalResize = (height: number) => {
    setTerminalHeight(height);
  };

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header />
      
      <div className="flex-1 overflow-hidden flex">
        <PanelGroup key={panelGroupKey} direction="horizontal" className="h-full">
          {/* 左侧：项目列表 */}
          {!sidebarCollapsed ? (
            <>
              <Panel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                className="flex flex-col"
              >
                <Sidebar 
                  isCollapsed={sidebarCollapsed} 
                  onToggle={handleSidebarToggle} 
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
            </>
          ) : (
            <div 
              className="flex flex-col border-r border-border"
              style={{ width: '48px' }}
            >
              <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={handleSidebarToggle} 
              />
            </div>
          )}
          
          {/* 中间：聊天区域 */}
          <Panel
            defaultSize={sidebarCollapsed ? 40 : 35}
            minSize={25}
            maxSize={60}
            className="flex flex-col"
          >
            <ChatContainer />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
          
          {/* 右侧：预览+代码+终端 */}
          <Panel
            defaultSize={sidebarCollapsed ? 60 : 45}
            minSize={30}
            className="flex flex-col"
          >
            {/* Tab Bar */}
            <PreviewCodeTabBar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as 'preview' | 'code')} />
            
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'preview' && <PreviewPanel />}
              {activeTab === 'code' && <CodeEditor />}
            </div>
            
            {/* Terminal */}
            <TerminalPanel
              isExpanded={terminalExpanded}
              onToggle={() => setTerminalExpanded(!terminalExpanded)}
              height={terminalHeight}
              onResize={handleTerminalResize}
            />
          </Panel>
        </PanelGroup>
      </div>
      
      <StatusBar />
    </div>
  );
}

export default App;
