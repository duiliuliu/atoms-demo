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
  const resizeRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const { lines, clearLines } = useTerminalStore();
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
    xterm.writeln('\x1b[36m│  Atoms.dev Terminal v1.0            │\x1b[0m');
    xterm.writeln('\x1b[36m╰───────────────────────────────────────╯\x1b[0m');
    xterm.writeln('');
    xterm.writeln('\x1b[90mType "help" for available commands.\x1b[0m');
    xterm.writeln('');
    xterm.write('\x1b[32m$\x1b[0m ');

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
        xterm.writeln(lastLine.content);
        xterm.write('\x1b[32m$\x1b[0m ');
        break;
      case 'stdout':
        xterm.writeln(lastLine.content);
        xterm.write('\x1b[32m$\x1b[0m ');
        break;
      case 'stderr':
        xterm.writeln(`\x1b[31m${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m$\x1b[0m ');
        break;
      case 'error':
        xterm.writeln(`\x1b[31mError: ${lastLine.content}\x1b[0m`);
        xterm.write('\x1b[32m$\x1b[0m ');
        break;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !sandboxId) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('terminal:execute', { command: command.trim() });
    }

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
        className="border-t border-border bg-bg-secondary cursor-pointer hover:bg-bg-tertiary transition flex items-center justify-between px-3"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">终端</span>
        </div>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
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
          <span className="text-xs text-text-secondary">终端</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearLines}
            className="p-1 hover:bg-bg-tertiary rounded transition"
            title="清空"
          >
            <Trash2 className="w-3 h-3 text-text-secondary" />
          </button>
          <div 
            ref={resizeRef}
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
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={sandboxId ? '输入命令...' : '等待沙箱启动...'}
            disabled={!sandboxId}
            className="flex-1 bg-transparent text-cyan-300 font-mono text-sm outline-none placeholder-text-muted disabled:opacity-50"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </form>
    </div>
  );
};
