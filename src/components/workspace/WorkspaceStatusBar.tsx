import type { BugAnswer } from '../../types/round';

export interface WorkspaceStatusBarProps {
  activePath: string;
  cursorPos: { line: number; col: number };
  markedBug: BugAnswer | null;
  pyodideVersion?: string;
}

export function WorkspaceStatusBar({
  activePath,
  cursorPos,
  markedBug,
  pyodideVersion = '0.27.7',
}: WorkspaceStatusBarProps) {
  return (
    <footer className="ws-statusbar">
      <div className="ws-statusbar-left">
        <span className="ws-status-brand">CogniCode</span>
        <span className="ws-status-path">{activePath}</span>
        <span className="ws-status-pos">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>

      <div className="ws-statusbar-right">
        <span className="ws-status-marked">
          {markedBug ? `Marked ${markedBug.file}:${markedBug.line}` : 'No bug marked'}
        </span>
        <span className="ws-status-sep">·</span>
        <span className="ws-status-runtime">Pyodide {pyodideVersion} · WebAssembly</span>
      </div>
    </footer>
  );
}
