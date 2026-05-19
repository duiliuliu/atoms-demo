import { useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Layout/Header';
import { ChatContainer } from './components/Chat/ChatContainer';
import { PreviewPanel } from './components/Preview/PreviewPanel';
import { CodeEditor } from './components/Editor/CodeEditor';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { TabBar } from './components/Layout/TabBar';
import { StatusBar } from './components/Layout/StatusBar';
import { initSocket, useUIStore } from './stores';

function App() {
  useEffect(() => {
    initSocket();
  }, []);

  const { activeTab, leftPanelSize } = useUIStore();

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header />
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel
            defaultSize={leftPanelSize}
            minSize={25}
            maxSize={60}
            className="flex flex-col"
          >
            <ChatContainer />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
          
          <Panel
            defaultSize={100 - leftPanelSize}
            minSize={30}
            className="flex flex-col"
          >
            <TabBar />
            <div className="flex-1 overflow-hidden">
              {activeTab === 'preview' && <PreviewPanel />}
              {activeTab === 'code' && <CodeEditor />}
              {activeTab === 'terminal' && <TerminalPanel />}
            </div>
          </Panel>
        </PanelGroup>
      </div>
      
      <StatusBar />
    </div>
  );
}

export default App;
