import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Shield,
  Target,
  FileCheck,
} from 'lucide-react';
import type { CodeFile, ChallengeDescription } from '../../types/round';

export interface WorkspaceLeftPanelProps {
  activeTab: 'problem' | 'explorer';
  onTabChange: (tab: 'problem' | 'explorer') => void;
  category: string;
  title: string;
  description: string;
  structuredDescription?: ChallengeDescription;
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
  structuredDescription,
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

            {structuredDescription ? (
              <div className="ws-structured-desc">
                {/* 1. Problem & Context */}
                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-purple-bright" />
                    <span>PROBLEM</span>
                  </div>
                  <p className="ws-problem-desc">{structuredDescription.problem}</p>
                </div>

                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <FileText size={12} className="text-purple-bright" />
                    <span>CONTEXT</span>
                  </div>
                  <p className="ws-problem-desc text-muted">{structuredDescription.context}</p>
                </div>

                {/* 2. Task */}
                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <Target size={12} className="text-purple-bright" />
                    <span>YOUR TASK</span>
                  </div>
                  <div className="ws-task-callout">
                    <p>{structuredDescription.task}</p>
                  </div>
                </div>

                {/* 3. Expected Behavior */}
                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-purple-bright" />
                    <span>EXPECTED BEHAVIOR</span>
                  </div>
                  <p className="ws-problem-desc">{structuredDescription.expectedBehavior}</p>
                </div>

                {/* 4. Constraints */}
                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <Shield size={12} className="text-purple-bright" />
                    <span>CONSTRAINTS & INVARIANTS</span>
                  </div>
                  <ul className="ws-invariants-list">
                    {structuredDescription.constraints.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. Success Criteria */}
                <div className="ws-desc-section">
                  <div className="ws-section-label flex items-center gap-1.5">
                    <FileCheck size={12} className="text-purple-bright" />
                    <span>SUCCESS CRITERIA</span>
                  </div>
                  <p className="ws-success-criteria">{structuredDescription.successCriteria}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="ws-problem-desc">{description}</p>
                <div className="ws-section-label">EXPECTED INVARIANTS</div>
                <ul className="ws-invariants-list">
                  {expectedBehaviour.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}

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
                {collapsedFolders['app'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <Folder size={13} className="folder-icon" />
                <span>app</span>
              </button>

              {!collapsedFolders['app'] && (
                <div className="ws-tree-children">
                  {appFiles.map(file => {
                    const isSelected = activePath === file.path;
                    const isMarked = Boolean(markedLines[file.path]);
                    return (
                      <button
                        key={file.path}
                        className={`ws-tree-file ${isSelected ? 'selected' : ''}`}
                        onClick={() => onOpenFile(file.path)}
                      >
                        <FileCode2 size={13} className="file-icon" />
                        <span className="file-name">{file.path.replace('app/', '')}</span>
                        {isMarked && <span className="ws-file-bug-dot" title="Marked as bug" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* tests/ folder */}
            <div className="ws-tree-group">
              <button
                className="ws-tree-folder"
                onClick={() => toggleFolder('tests')}
              >
                {collapsedFolders['tests'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <Folder size={13} className="folder-icon" />
                <span>tests</span>
              </button>

              {!collapsedFolders['tests'] && (
                <div className="ws-tree-children">
                  {testFiles.map(file => {
                    const isSelected = activePath === file.path;
                    const isMarked = Boolean(markedLines[file.path]);
                    return (
                      <button
                        key={file.path}
                        className={`ws-tree-file ${isSelected ? 'selected' : ''}`}
                        onClick={() => onOpenFile(file.path)}
                      >
                        <FileCode2 size={13} className="file-icon" />
                        <span className="file-name">{file.path.replace('tests/', '')}</span>
                        {isMarked && <span className="ws-file-bug-dot" title="Marked as bug" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* root files */}
            {rootFiles.map(file => {
              const isSelected = activePath === file.path;
              return (
                <button
                  key={file.path}
                  className={`ws-tree-file root-file ${isSelected ? 'selected' : ''}`}
                  onClick={() => onOpenFile(file.path)}
                >
                  <FileText size={13} className="file-icon" />
                  <span className="file-name">{file.path}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
