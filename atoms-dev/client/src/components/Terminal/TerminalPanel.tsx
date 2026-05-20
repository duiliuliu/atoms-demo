import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useTerminalStore, useProjectStore, getSocket } from '@/stores';
import { Terminal as TerminalIcon, Trash2, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  height: number;
  onResize: (height: number) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isExpanded,
  onToggle,
  height,
  onResize
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState('');
  const { lines, addLine } = useTerminalStore();
  const { sandboxId } = useProjectStore();

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerminal({
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#58a6ff30',
        black: '#161b22',
        red: '#f85149',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#f778ba',
        cyan: '#56d4dd',
        white: '#c9d1d9',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#ff7bba',
        brightCyan: '#7ee787',
        brightWhite: '#f0f6fc',
      },
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.writeln('\x1b[36m╭───────────────────────────────────────╮\x1b[0m');
    xterm.writeln('\x1b[36m│  Atoms.dev Console                   │\x1b[0m');
    xterm.writeln('\x1b[36m╰───────────────────────────────────────╯\x1b[0m');
    xterm.writeln('');
    xterm.writeln('\x1b[90mType "help" for available commands.\x1b[0m');
    xterm.writeln('\x1b[90mType "clear" to clear the console.\x1b[0m');
    xterm.writeln('');
    xterm.write('\x1b[32m>\x1b[0m ');

    const handleResize = () => {
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
      xtermRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!xtermRef.current || lines.length === 0) return;

    const xterm = xtermRef.current;
    const lastLine = lines[lines.length - 1];

    switch (lastLine.type) {
      case 'command':
        xterm.writeln(`\x1b[90m${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'stdout':
        xterm.writeln(lastLine.content);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'stderr':
        xterm.writeln(`\x1b[31m${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'error':
        xterm.writeln(`\x1b[31mError: ${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'log':
        xterm.writeln(`\x1b[34m[LOG] ${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'info':
        xterm.writeln(`\x1b[36m[INFO] ${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
      case 'warn':
        xterm.writeln(`\x1b[33m[WARN] ${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m>\x1b[0m ');
        break;
    }
  }, [lines]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleLog = (data: { type: string; message: string }) => {
      addLine({
        type: data.type as any,
        content: data.message
      });
    };

    socket.on('console:log', handleLog);
    
    return () => {
      socket.off('console:log', handleLog);
    };
  }, [addLine]);

  const executeCommand = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase().trim();

    if (lowerCmd === 'help') {
      addLine({ type: 'info', content: '可用命令:' });
      addLine({ type: 'stdout', content: '  clear      - 清空控制台' });
      addLine({ type: 'stdout', content: '  help       - 显示此帮助信息' });
      addLine({ type: 'stdout', content: '  ls         - 列出项目文件' });
      addLine({ type: 'stdout', content: '  echo <msg> - 输出消息' });
      addLine({ type: 'stdout', content: '  eval <js>  - 执行JavaScript代码' });
      addLine({ type: 'stdout', content: '  其他命令将作为shell命令执行' });
      return;
    }

    if (lowerCmd === 'clear') {
      if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.writeln('\x1b[36m╭───────────────────────────────────────╮\x1b[0m');
        xtermRef.current.writeln('\x1b[36m│  Atoms.dev Console                   │\x1b[0m');
        xtermRef.current.writeln('\x1b[36m╰───────────────────────────────────────╯\x1b[0m');
        xtermRef.current.write('\x1b[32m>\x1b[0m ');
      }
      return;
    }

    if (lowerCmd.startsWith('echo ')) {
      const message = cmd.substring(5);
      addLine({ type: 'stdout', content: message });
      return;
    }

    if (lowerCmd.startsWith('eval ')) {
      const jsCode = cmd.substring(5);
      try {
        const result = eval(jsCode);
        addLine({ type: 'stdout', content: String(result) });
      } catch (error) {
        addLine({ type: 'error', content: (error as Error).message });
      }
      return;
    }

    if (lowerCmd === 'ls') {
      const socket = getSocket();
      if (socket) {
        socket.emit('files:list');
      }
      return;
    }

    const socket = getSocket();
    if (socket && sandboxId) {
      addLine({ type: 'command', content: `$ ${cmd}` });
      socket.emit('terminal:execute', { command: cmd });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    addLine({ type: 'command', content: `> ${command}` });
    executeCommand(command);
    setCommand('');
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(60, Math.min(400, startHeight + deltaY));
      onResize(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height, onResize]);

  if (!isExpanded) {
    return (
      <div 
        className="border-t border-border bg-bg-secondary cursor-pointer hover:bg-bg-tertiary transition flex items-center justify-between px-3 h-6"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs text-text-secondary">控制台</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
      </div>
    );
  }

  return (
    <div 
      className="border-t border-border bg-bg-primary flex flex-col"
      style={{ height: `${height}px` }}
    >
      {/* Toolbar */}
      <div className="h-6 bg-bg-secondary border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs text-text-secondary">控制台</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (xtermRef.current) {
                xtermRef.current.clear();
                xtermRef.current.writeln('\x1b[36m╭───────────────────────────────────────╮\x1b[0m');
                xtermRef.current.writeln('\x1b[36m│  Atoms.dev Console                   │\x1b[0m');
                xtermRef.current.writeln('\x1b[36m╰───────────────────────────────────────╯\x1b[0m');
                xtermRef.current.write('\x1b[32m>\x1b[0m ');
              }
            }}
            className="p-1 hover:bg-bg-tertiary rounded transition"
            title="清空"
          >
            <Trash2 className="w-3 h-3 text-text-secondary" />
          </button>
          <div 
            className="w-4 h-full cursor-ns-resize hover:bg-bg-tertiary rounded flex items-center justify-center"
            onMouseDown={handleMouseDown}
            title="拖动调整大小"
          >
            <Minus className="w-3 h-3 text-text-muted" />
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-bg-tertiary rounded transition"
            title="折叠"
          >
            <ChevronUp className="w-3 h-3 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={terminalRef}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-border bg-bg-secondary">
        <div className="flex items-center gap-2 bg-[#0d1117] rounded px-3 py-1.5 border border-border">
          <span className="text-green-400 font-mono text-sm">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="输入命令... (输入 help 查看帮助)"
            className="flex-1 bg-transparent text-cyan-300 font-mono text-sm outline-none placeholder-text-muted"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </form>
    </div>
  );
};
