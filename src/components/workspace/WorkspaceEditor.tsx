import Editor, { type OnMount } from '@monaco-editor/react';
import { FileCode2, FileText, X } from 'lucide-react';
import type { CodeFile } from '../../types/round';

export interface WorkspaceEditorProps {
  openPaths: string[];
  activePath: string;
  activeFile: CodeFile;
  markedLines: Record<string, number>;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onEditorMount: OnMount;
}

export function WorkspaceEditor({
  openPaths,
  activePath,
  activeFile,
  markedLines,
  onSelectTab,
  onCloseTab,
  onEditorMount,
}: WorkspaceEditorProps) {
  return (
    <div className="ws-editor-wrap">
      {/* Editor Tab Strip */}
      <div className="ws-editor-tabstrip" role="tablist">
        {openPaths.map(path => {
          const isActive = path === activePath;
          const fileName = path.split('/').pop() || path;
          const isPython = path.endsWith('.py');
          const isMarked = markedLines[path] !== undefined;

          return (
            <div
              key={path}
              role="tab"
              aria-selected={isActive}
              className={`ws-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(path)}
            >
              {isPython ? <FileCode2 size={13} className="ws-tab-icon py" /> : <FileText size={13} className="ws-tab-icon md" />}
              <span className="ws-tab-name">{fileName}</span>
              {isMarked && <span className="ws-bug-dot mini" title="Marked line" />}
              {openPaths.length > 1 && (
                <button
                  className="ws-tab-close"
                  onClick={e => {
                    e.stopPropagation();
                    onCloseTab(path);
                  }}
                  aria-label={`Close ${fileName}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Sub-header with path and read-only indicator */}
      <div className="ws-editor-pathbar">
        <span className="ws-path-text">{activePath}</span>
        <span className="ws-readonly-badge">
          {activeFile.language === 'python' ? 'Python' : 'Markdown'} · read only (click gutter to mark bug)
        </span>
      </div>

      {/* Monaco Code Editor */}
      <div className="ws-monaco-container">
        <Editor
          key={activePath}
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          theme="cognicode-studio"
          onMount={onEditorMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', 'DM Mono', SFMono-Regular, Menlo, monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            overviewRulerLanes: 0,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            contextmenu: false,
          }}
        />
      </div>
    </div>
  );
}
