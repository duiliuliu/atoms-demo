import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useTerminalStore, useProjectStore, getSocket } from '@/stores';
import { Trash2, Terminal as TerminalIcon } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

export const TerminalPanel: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState('');
  const { lines, clearLines } = useTerminalStore();
  const { sandboxId } = useProjectStore();

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#ffffff',
        cursor: '#6c63ff',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#6c63ff50',
        black: '#000000',
        red: '#ff4d4f',
        green: '#52c41a',
        yellow: '#faad14',
        blue: '#1890ff',
        magenta: '#eb2f96',
        cyan: '#13c2c2',
        white: '#ffffff',
        brightBlack: '#595959',
        brightRed: '#ff7875',
        brightGreen: '#73d13d',
        brightYellow: '#ffd666',
        brightBlue: '#40a9ff',
        brightMagenta: '#f759ab',
        brightCyan: '#36cfc9',
        brightWhite: '#ffffff',
      },
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.writeln('\x1b[36m╭───────────────────────────────────────╮\x1b[0m');
    xterm.writeln('\x1b[36m│  Atoms.dev Terminal                 │\x1b[0m');
    xterm.writeln('\x1b[36m╰───────────────────────────────────────╯\x1b[0m');
    xterm.writeln('');
    xterm.writeln('\x1b[90mType "help" for available commands.\x1b[0m');
    xterm.writeln('');

    const handleResize = () => {
      if (fitAddonRef.current) {
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

  // Write new lines to terminal
  useEffect(() => {
    if (!xtermRef.current || lines.length === 0) return;

    const xterm = xtermRef.current;
    const lastLine = lines[lines.length - 1];

    switch (lastLine.type) {
      case 'command':
        xterm.writeln(`\x1b[90m${lastLine.content}\x1b[0m`);
        break;
      case 'stdout':
        xterm.writeln(lastLine.content);
        break;
      case 'stderr':
        xterm.writeln(`\x1b[31m${lastLine.content}\x1b[0m`);
        break;
      case 'error':
        xterm.writeln(`\x1b[31mError: ${lastLine.content}\x1b[0m`);
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

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Toolbar */}
      <div className="h-10 bg-bg-secondary border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">终端</span>
        </div>
        <button
          onClick={clearLines}
          className="p-1.5 hover:bg-bg-tertiary rounded transition"
          title="清空"
        >
          <Trash2 className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden p-2">
        <div
          ref={terminalRef}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-border bg-bg-secondary">
        <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg px-3 py-2">
          <span className="text-primary font-mono">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={sandboxId ? '输入命令...' : '等待沙箱启动...'}
            disabled={!sandboxId}
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder-text-muted disabled:opacity-50"
          />
        </div>
      </form>
    </div>
  );
};
