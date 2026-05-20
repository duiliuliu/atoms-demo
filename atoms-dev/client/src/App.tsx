import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Layout/Header';
import { ChatContainer } from './components/Chat/ChatContainer';
import { PreviewPanel } from './components/Preview/PreviewPanel';
import { CodeEditor } from './components/Editor/CodeEditor';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { StatusBar } from './components/Layout/StatusBar';
import { Sidebar } from './components/Layout/Sidebar';
import { initSocket } from './stores';

function App() {
  useEffect(() => {
    initSocket();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header />
      
      <div className="flex-1 overflow-hidden flex">
        <PanelGroup direction="horizontal" className="h-full">
          {/* 左侧：项目列表 */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className="flex flex-col"
          >
            <Sidebar />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
          
          {/* 中间：聊天区域 */}
          <Panel
            defaultSize={35}
            minSize={25}
            maxSize={50}
            className="flex flex-col"
          >
            <ChatContainer />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
          
          {/* 右侧：预览+代码+终端 */}
          <Panel
            defaultSize={45}
            minSize={30}
            className="flex flex-col"
          >
            <PanelGroup direction="horizontal" className="h-full">
              {/* 预览 */}
              <Panel
                defaultSize={50}
                minSize={30}
                className="flex flex-col"
              >
                <div className="h-8 bg-bg-tertiary border-b border-border flex items-center px-3 text-xs text-text-secondary">
                  预览
                </div>
                <div className="flex-1 overflow-hidden">
                  <PreviewPanel />
                </div>
              </Panel>
              
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
              
              {/* 代码编辑器 */}
              <Panel
                defaultSize={50}
                minSize={30}
                className="flex flex-col"
              >
                <div className="h-8 bg-bg-tertiary border-b border-border flex items-center px-3 text-xs text-text-secondary">
                  代码
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor />
                </div>
              </Panel>
            </PanelGroup>
            
            {/* 终端 */}
            <div className="h-32 border-t border-border flex flex-col">
              <div className="h-6 bg-bg-tertiary flex items-center px-3 text-xs text-text-secondary">
                终端
              </div>
              <div className="flex-1 overflow-hidden">
                <TerminalPanel />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
      
      <StatusBar />
    </div>
  );
}

export default App;
