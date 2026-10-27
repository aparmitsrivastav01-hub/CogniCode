import { Check, CheckCircle2, Code2, Play, Terminal, X } from 'lucide-react';
import type { BugAnswer, TestReport } from '../../types/round';

export type WorkspaceBottomTab = 'Output' | 'Find Bug' | 'Test Results' | 'Explain';

export interface WorkspaceBottomPanelProps {
  activeTab: WorkspaceBottomTab;
  onTabChange: (tab: WorkspaceBottomTab) => void;
  entryFile: string;
  outputAnswer: string;
  onOutputAnswerChange: (value: string) => void;
  onCheckOutput: () => void;
  onRunEntry: () => void;
  checkingOutput: boolean;
  revealedOutput: string | null;
  outputFeedback: string;
  outputCorrect: boolean;
  runtimeState: 'loading' | 'ready' | 'offline';
  runtimeError: string;
  locked: boolean;
  markedBug: BugAnswer | null;
  onClearMark: () => void;
  onSubmit: () => void;
  onRunTests: () => void;
  testRunning: boolean;
  testReport: TestReport | null;
  explanation: string;
  onExplanationChange: (value: string) => void;
}

export function WorkspaceBottomPanel({
  activeTab,
  onTabChange,
  entryFile,
  outputAnswer,
  onOutputAnswerChange,
  onCheckOutput,
  onRunEntry,
  checkingOutput,
  revealedOutput,
  outputFeedback,
  outputCorrect,
  runtimeState,
  runtimeError,
  locked,
  markedBug,
  onClearMark,
  onSubmit,
  onRunTests,
  testRunning,
  testReport,
  explanation,
  onExplanationChange,
}: WorkspaceBottomPanelProps) {
  const tabs: { key: WorkspaceBottomTab; label: string; icon: React.ReactNode }[] = [
    { key: 'Output', label: 'Output', icon: <Terminal size={13} /> },
    { key: 'Find Bug', label: 'Find Bug', icon: <span className="ws-dot-icon" /> },
    { key: 'Test Results', label: 'Test Results', icon: <Code2 size={13} /> },
    { key: 'Explain', label: 'Explain', icon: null },
  ];

  const wordCount = explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
  const entryModule = entryFile.replace('.py', '');

  return (
    <div className="ws-bottom-panel">
      {/* Tabs Header */}
      <div className="ws-bottom-tabs" role="tablist">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              className={`ws-bottom-tab ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.key === 'Test Results' && testReport && (
                <span className="ws-tab-count">{testReport.results.length}</span>
              )}
              {tab.key === 'Find Bug' && markedBug && (
                <span className="ws-bug-dot mini" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Drawer */}
      <div className="ws-bottom-content">
        {activeTab === 'Output' && (
          <div className="ws-output-content">
            <label className="ws-output-label">
              Predict what <code>python -m {entryModule}</code> will print:
            </label>

            <div className="ws-output-input-row">
              <input
                type="text"
                className="ws-mono-input"
                placeholder="Enter predicted output line…"
                value={outputAnswer}
                onChange={e => onOutputAnswerChange(e.target.value)}
                disabled={locked || runtimeState !== 'ready'}
              />
              <button
                className="ws-btn ws-btn-outline"
                onClick={onCheckOutput}
                disabled={locked || runtimeState !== 'ready' || checkingOutput}
              >
                {checkingOutput ? 'Checking…' : 'Check prediction'}
              </button>
              <button
                className="ws-btn ws-btn-outline"
                onClick={onRunEntry}
                disabled={locked || runtimeState !== 'ready' || checkingOutput}
              >
                Run entry
              </button>
            </div>

            {outputFeedback && (
              <div className={`ws-feedback-msg ${outputCorrect ? 'success' : 'warn'}`}>
                {outputCorrect ? <Check size={13} /> : null}
                <span>{outputFeedback}</span>
              </div>
            )}

            {revealedOutput !== null && (
              <div className="ws-terminal-display">
                <div className="ws-terminal-header">
                  <span>LIVE PYTHON STDOUT</span>
                </div>
                <pre>{revealedOutput}</pre>
              </div>
            )}

            {runtimeState === 'offline' && (
              <div className="ws-offline-warning">
                <strong>Python offline:</strong> {runtimeError || 'WebAssembly worker could not load.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Find Bug' && (
          <div className="ws-findbug-content">
            <p className="ws-tool-helper">
              Click any line number in the editor gutter to mark the root-cause bug.
            </p>

            {markedBug ? (
              <div className="ws-marked-bar">
                <span className="ws-marked-chip">
                  <span className="ws-bug-glyph">●</span>
                  {markedBug.file} : line {markedBug.line}
                </span>
                <button className="ws-btn ws-btn-quiet compact" onClick={onClearMark}>
                  Clear mark
                </button>
                <button className="ws-btn ws-btn-primary compact" onClick={onSubmit} disabled={locked}>
                  Submit answer
                </button>
              </div>
            ) : (
              <div className="ws-unmarked-msg">
                No line marked in active file. Click line number in gutter to record your answer.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Test Results' && (
          <div className="ws-tests-content">
            <div className="ws-tests-header">
              <span className="ws-tool-helper">
                Execute unit tests in <code>tests/</code> with Python unittest.
              </span>
              <button
                className="ws-btn ws-btn-primary compact"
                onClick={onRunTests}
                disabled={locked || runtimeState !== 'ready' || testRunning}
              >
                <Play size={13} />
                <span>{testRunning ? 'Running…' : 'Run tests'}</span>
              </button>
            </div>

            {testReport && (
              <div className="ws-tests-list">
                {testReport.results.map((test, idx) => (
                  <div key={idx} className="ws-test-row">
                    <span className={`ws-test-pill ${test.status}`}>
                      {test.status === 'passed' ? <CheckCircle2 size={12} /> : <X size={12} />}
                      <span>{test.status}</span>
                    </span>
                    <code className="ws-test-name">{test.name}</code>
                    <span className="ws-test-ms">{test.ms} ms</span>
                  </div>
                ))}
                {testReport.stderr && (
                  <pre className="ws-test-stderr">{testReport.stderr}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Explain' && (
          <div className="ws-explain-content">
            <div className="ws-explain-top">
              <label className="ws-tool-helper">
                Explain why the code produces this behaviour:
              </label>
              <span className="ws-word-count">{wordCount} words</span>
            </div>
            <textarea
              className="ws-explain-textarea"
              rows={3}
              placeholder="Describe how values propagate through the files and why the bug occurs…"
              value={explanation}
              onChange={e => onExplanationChange(e.target.value)}
              disabled={locked}
            />
            <div className="ws-explain-footnote">
              Explanation will be recorded with your submission.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
