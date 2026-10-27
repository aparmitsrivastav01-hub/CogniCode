import { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, FileText, Folder, Sparkles } from 'lucide-react';
import type { CodeFile } from '../../types/round';

export interface WorkspaceLeftPanelProps {
  activeTab: 'problem' | 'explorer';
  onTabChange: (tab: 'problem' | 'explorer') => void;
  category: string;
  title: string;
  description: string;
  expectedBehaviour: string[];
  hintsRevealed: number[];
  hintsRubric: string[];
  files: CodeFile[];
  activePath: string;
  onOpenFile: (path: string) => void;
  markedLines: Record<string, number>;
}

export function WorkspaceLeftPanel({
  activeTab,
  onTabChange,
  category,
  title,
  description,
  expectedBehaviour,
  hintsRevealed,
  hintsRubric,
  files,
  activePath,
  onOpenFile,
  markedLines,
}: WorkspaceLeftPanelProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const appFiles = files.filter(f => f.path.startsWith('app/'));
  const testFiles = files.filter(f => f.path.startsWith('tests/'));
  const rootFiles = files.filter(f => !f.path.includes('/'));

  return (
    <aside className="ws-left-panel">
      {/* Panel Tab Switcher */}
      <div className="ws-left-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'problem'}
          className={`ws-left-tab ${activeTab === 'problem' ? 'active' : ''}`}
          onClick={() => onTabChange('problem')}
        >
          Problem
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'explorer'}
          className={`ws-left-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => onTabChange('explorer')}
        >
          Explorer ({files.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="ws-left-content">
        {activeTab === 'problem' ? (
          <div className="ws-problem-body">
            <span className="ws-eyebrow">
              {category.toUpperCase()} · PYTHON 3
            </span>

            <h1 className="ws-problem-title">{title}</h1>

            <p className="ws-problem-desc">{description}</p>

            <div className="ws-section-label">EXPECTED INVARIANTS</div>
            <ul className="ws-invariants-list">
              {expectedBehaviour.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            {hintsRevealed.length > 0 && (
              <div className="ws-hints-section">
                <div className="ws-section-label">REVEALED HINTS</div>
                {hintsRevealed.map(idx => (
                  <div key={idx} className="ws-hint-card">
                    <Sparkles size={14} className="ws-hint-sparkle" />
                    <div>
                      <strong>Hint {idx + 1}</strong>
                      <p>{hintsRubric[idx] || 'Review variable normalization logic.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="ws-explorer-body">
            <div className="ws-explorer-root">
              <ChevronDown size={13} />
              <span>COGNICODE REPO</span>
            </div>

            {/* app/ folder */}
            <div className="ws-tree-group">
              <button
                className="ws-tree-folder"
                onClick={() => toggleFolder('app')}
              >
                {collapsedFolders['app'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                <Folder size={14} />
                <span>app</span>
              </button>
              {!collapsedFolders['app'] && (
                <div className="ws-tree-nested">
                  {appFiles.map(file => {
                    const isSelected = activePath === file.path;
                    const hasMark = markedLines[file.path] !== undefined;
                    return (
                      <button
                        key={file.path}
                        className={`ws-tree-file ${isSelected ? 'selected' : ''}`}
                        onClick={() => onOpenFile(file.path)}
                      >
                        <FileCode2 size={13} />
                        <span>{file.path.replace('app/', '')}</span>
                        {hasMark && <span className="ws-bug-dot" title="Bug line marked" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* tests/ folder */}
            {testFiles.length > 0 && (
              <div className="ws-tree-group">
                <button
                  className="ws-tree-folder"
                  onClick={() => toggleFolder('tests')}
                >
                  {collapsedFolders['tests'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <Folder size={14} />
                  <span>tests</span>
                </button>
                {!collapsedFolders['tests'] && (
                  <div className="ws-tree-nested">
                    {testFiles.map(file => {
                      const isSelected = activePath === file.path;
                      const hasMark = markedLines[file.path] !== undefined;
                      return (
                        <button
                          key={file.path}
                          className={`ws-tree-file ${isSelected ? 'selected' : ''}`}
                          onClick={() => onOpenFile(file.path)}
                        >
                          <FileCode2 size={13} />
                          <span>{file.path.replace('tests/', '')}</span>
                          {hasMark && <span className="ws-bug-dot" title="Bug line marked" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* root files */}
            {rootFiles.map(file => {
              const isSelected = activePath === file.path;
              const hasMark = markedLines[file.path] !== undefined;
              return (
                <button
                  key={file.path}
                  className={`ws-tree-file ${isSelected ? 'selected' : ''}`}
                  onClick={() => onOpenFile(file.path)}
                >
                  {file.path.endsWith('.md') ? <FileText size={13} /> : <FileCode2 size={13} />}
                  <span>{file.path}</span>
                  {hasMark && <span className="ws-bug-dot" title="Bug line marked" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
