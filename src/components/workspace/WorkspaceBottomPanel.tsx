import {
  Check,
  CheckCircle2,
  Code2,
  Play,
  Terminal,
  X,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Search,
  RotateCcw,
} from 'lucide-react';
import type { Challenge, BugAnswer, TestReport, VerificationStatus } from '../../types/round';

export type WorkspaceBottomTab = 'Predict Output' | 'Find Bug' | 'Test Results' | 'Explain';

export interface WorkspaceBottomPanelProps {
  challenge: Challenge;
  activeTab: WorkspaceBottomTab;
  onTabChange: (tab: WorkspaceBottomTab) => void;
  entryFile: string;
  outputAnswer: string;
  onOutputAnswerChange: (value: string) => void;
  onCheckOutput: () => void;
  checkingOutput: boolean;
  revealedOutput: string | null;
  outputFeedback: string;
  outputCorrect: boolean;
  outputAttempts: number;
  gemmaPredictionFeedback: string;
  gemmaPredictionLoading: boolean;
  onRunEntry: () => void;
  runtimeState: 'loading' | 'ready' | 'offline';
  runtimeError: string;
  locked: boolean;
  markedBug: BugAnswer | null;
  onClearMark: () => void;
  onSubmit: () => void;
  onRunTests: () => void;
  testRunning: boolean;
  testReport: TestReport | null;
  gemmaTestExplanation: string;
  gemmaTestLoading: boolean;
  onAskGemmaTestHelp: () => void;
  explanation: string;
  onExplanationChange: (value: string) => void;
  gemmaExplanation: string;
  gemmaExplanationLoading: boolean;
  onRequestGemmaExplanation: (full: boolean) => void;
}

export function WorkspaceBottomPanel({
  challenge,
  activeTab,
  onTabChange,
  entryFile,
  outputAnswer,
  onOutputAnswerChange,
  onCheckOutput,
  checkingOutput,
  revealedOutput,
  outputFeedback,
  outputCorrect,
  outputAttempts,
  gemmaPredictionFeedback,
  gemmaPredictionLoading,
  onRunEntry,
  runtimeState,
  runtimeError,
  locked,
  markedBug,
  onClearMark,
  onSubmit,
  onRunTests,
  testRunning,
  testReport,
  gemmaTestExplanation,
  gemmaTestLoading,
  onAskGemmaTestHelp,
  explanation,
  onExplanationChange,
  gemmaExplanation,
  gemmaExplanationLoading,
  onRequestGemmaExplanation,
}: WorkspaceBottomPanelProps) {
  const tabs: { key: WorkspaceBottomTab; label: string; icon: React.ReactNode }[] = [
    { key: 'Predict Output', label: 'Predict Output', icon: <Terminal size={13} /> },
    { key: 'Find Bug', label: 'Find Bug', icon: <span className="ws-dot-icon" /> },
    { key: 'Test Results', label: 'Test Results', icon: <Code2 size={13} /> },
    { key: 'Explain', label: 'Explain', icon: null },
  ];

  const wordCount = explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
  const entryModule = entryFile.replace('.py', '').replace(/\//g, '.');

  // Compute evidence-based verification status
  let verificationStatus: VerificationStatus = 'not_verified';
  let verificationTitle = 'Not yet verified';
  let verificationMessage =
    'No test suite execution recorded yet. Run unit tests to inspect execution evidence.';

  if (testReport) {
    if (testReport.error && testReport.results.length === 0) {
      verificationStatus = 'failed';
      verificationTitle = 'Execution error';
      verificationMessage = `Python test runner failed: ${testReport.error}`;
    } else {
      const failedList = testReport.results.filter(r => r.status === 'failed');
      if (failedList.length > 0) {
        verificationStatus = 'failed';
        verificationTitle = 'Failed';
        verificationMessage = `${failedList.length} of ${testReport.results.length} unit test(s) failed in Python unittest runner.`;
      } else if (testReport.results.length > 0) {
        if (markedBug) {
          verificationStatus = 'passed';
          verificationTitle = 'Passed';
          verificationMessage = `All ${testReport.results.length} tests passed and root-cause bug is marked at ${markedBug.file}:${markedBug.line}.`;
        } else {
          verificationStatus = 'incomplete';
          verificationTitle = 'Incomplete';
          verificationMessage = `All ${testReport.results.length} tests passed, but root-cause bug line has not yet been marked in the editor.`;
        }
      }
    }
  }

  const failedTests = testReport?.results.filter(r => r.status === 'failed') || [];

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
                <span className={`ws-tab-count ${verificationStatus}`}>
                  {testReport.results.length}
                </span>
              )}
              {tab.key === 'Find Bug' && markedBug && (
                <span className="ws-bug-dot mini" />
              )}
              {tab.key === 'Predict Output' && outputCorrect && (
                <span className="ws-tab-count passed">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Drawer */}
      <div className="ws-bottom-content">
        {/* 1. PREDICT OUTPUT TAB */}
        {activeTab === 'Predict Output' && (
          <div className="ws-output-content">
            {/* Contextual Scenario Card */}
            <div className="ws-scenario-card">
              <div className="ws-scenario-head">
                <span className="ws-scenario-tag">EXECUTION SCENARIO</span>
                <code className="ws-scenario-cmd">python -m {entryModule}</code>
              </div>
              <div className="ws-scenario-context">
                <strong>Context:</strong> {challenge.structuredDescription?.context || challenge.description}
              </div>
              <p className="ws-scenario-prompt">
                What do you think the program will output, and why?
              </p>
            </div>

            {/* Prediction Input & Actions */}
            <div className="ws-output-input-row">
              <input
                type="text"
                className="ws-mono-input"
                placeholder="Enter predicted stdout line (e.g. return value or print string)…"
                value={outputAnswer}
                onChange={e => onOutputAnswerChange(e.target.value)}
                disabled={locked || runtimeState !== 'ready' || checkingOutput}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && outputAnswer.trim()) {
                    e.preventDefault();
                    onCheckOutput();
                  }
                }}
              />
              <button
                className="ws-btn ws-btn-primary"
                onClick={onCheckOutput}
                disabled={locked || runtimeState !== 'ready' || checkingOutput || !outputAnswer.trim()}
              >
                {checkingOutput ? 'Verifying with Gemma 4…' : 'Submit prediction'}
              </button>
              {outputAttempts > 0 && (
                <button
                  className="ws-btn ws-btn-outline"
                  onClick={onRunEntry}
                  disabled={locked || runtimeState !== 'ready' || checkingOutput}
                  title="Run Python entry to view actual raw stdout"
                >
                  Reveal live stdout
                </button>
              )}
            </div>

            {/* Validation Feedback Banner */}
            {outputFeedback && (
              <div className={`ws-feedback-msg ${outputCorrect ? 'success' : 'warn'}`}>
                {outputCorrect ? <Check size={14} /> : <X size={14} />}
                <span>{outputFeedback}</span>
              </div>
            )}

            {/* Gemma 4 Evaluation Callout */}
            {gemmaPredictionLoading && (
              <div className="ws-gemma-eval-box loading">
                <Sparkles size={14} className="spin text-purple-bright" />
                <span>Gemma 4 is analyzing your prediction against actual execution evidence…</span>
              </div>
            )}

            {gemmaPredictionFeedback && !gemmaPredictionLoading && (
              <div className="ws-gemma-eval-box">
                <div className="ws-eval-head">
                  <Sparkles size={14} className="text-purple-bright" />
                  <span>Gemma 4 Prediction Evaluation</span>
                </div>
                <div className="ws-eval-body">
                  {gemmaPredictionFeedback.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('\n').map((line, lIdx) => (
                        <span key={lIdx}>
                          {line}
                          {lIdx < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Live Terminal STDOUT (Available after reveal) */}
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

        {/* 2. FIND BUG TAB */}
        {activeTab === 'Find Bug' && (
          <div className="ws-findbug-content">
            <div className="ws-findbug-guidance">
              <p className="ws-tool-helper">
                <strong>Investigate faulty logic:</strong> Inspect the active file and click any line number in the code editor gutter to mark your suspected root-cause bug.
              </p>
              <p className="ws-sub-helper">
                Distinguish suspected bugs from confirmed findings: run the unit tests in the <strong>Test Results</strong> tab to verify your reasoning against genuine test evidence.
              </p>
            </div>

            {markedBug ? (
              <div className="ws-marked-bar">
                <span className="ws-marked-chip">
                  <span className="ws-bug-glyph">●</span>
                  {markedBug.file} : line {markedBug.line}
                </span>
                <button className="ws-btn ws-btn-quiet compact" onClick={onClearMark}>
                  <RotateCcw size={12} />
                  <span>Clear mark</span>
                </button>
                <button className="ws-btn ws-btn-primary compact" onClick={onSubmit} disabled={locked}>
                  Submit answer
                </button>
              </div>
            ) : (
              <div className="ws-unmarked-msg">
                No line currently marked in active file. Click a line number in the gutter to record your suspected bug.
              </div>
            )}
          </div>
        )}

        {/* 3. TEST RESULTS TAB */}
        {activeTab === 'Test Results' && (
          <div className="ws-tests-content">
            <div className="ws-tests-header">
              <span className="ws-tool-helper">
                Execute unit tests in <code>tests/</code> with Python unittest.
              </span>
              <div className="ws-tests-action-group">
                {failedTests.length > 0 && (
                  <button
                    className="ws-btn ws-btn-outline compact"
                    onClick={onAskGemmaTestHelp}
                    disabled={gemmaTestLoading}
                    title="Ask Gemma 4 to explain why these assertions failed"
                  >
                    <Sparkles size={12} className={gemmaTestLoading ? 'spin' : 'text-purple-bright'} />
                    <span>{gemmaTestLoading ? 'Interpreting…' : 'Ask Gemma to interpret failures'}</span>
                  </button>
                )}
                <button
                  className="ws-btn ws-btn-primary compact"
                  onClick={onRunTests}
                  disabled={locked || runtimeState !== 'ready' || testRunning}
                >
                  <Play size={13} />
                  <span>{testRunning ? 'Running…' : 'Run tests'}</span>
                </button>
              </div>
            </div>

            {/* Evidence-Based Verification Status Banner */}
            <div className={`ws-verification-banner ${verificationStatus}`}>
              <div className="ws-verification-icon-wrap">
                {verificationStatus === 'passed' && <CheckCircle2 size={16} />}
                {verificationStatus === 'failed' && <XCircle size={16} />}
                {verificationStatus === 'incomplete' && <AlertCircle size={16} />}
                {verificationStatus === 'not_verified' && <HelpCircle size={16} />}
              </div>
              <div className="ws-verification-body">
                <div className="ws-verification-heading">
                  <span className="ws-verification-status-tag">{verificationTitle}</span>
                  <span className="ws-verification-sub">CogniCode Verification Evidence</span>
                </div>
                <div className="ws-verification-text">{verificationMessage}</div>
              </div>
            </div>

            {/* Gemma Test Failure Interpretation */}
            {gemmaTestLoading && (
              <div className="ws-gemma-eval-box loading">
                <Sparkles size={14} className="spin text-purple-bright" />
                <span>Gemma 4 is interpreting the test failure evidence…</span>
              </div>
            )}

            {gemmaTestExplanation && !gemmaTestLoading && (
              <div className="ws-gemma-eval-box">
                <div className="ws-eval-head">
                  <Sparkles size={14} className="text-purple-bright" />
                  <span>Gemma 4 Test Failure Interpretation</span>
                </div>
                <div className="ws-eval-body">
                  {gemmaTestExplanation.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('\n').map((line, lIdx) => (
                        <span key={lIdx}>
                          {line}
                          {lIdx < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results List */}
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

        {/* 4. EXPLAIN TAB */}
        {activeTab === 'Explain' && (
          <div className="ws-explain-content">
            {/* User Explanation Form */}
            <div className="ws-explain-top">
              <label className="ws-tool-helper">
                Explain why the code produces this behaviour in your own words:
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

            {/* Gemma 4 Explanation Section */}
            <div className="ws-explain-gemma-section">
              <div className="ws-explain-actions-row">
                {outputAttempts === 0 ? (
                  <button
                    className="ws-btn ws-btn-outline compact"
                    onClick={() => onRequestGemmaExplanation(false)}
                    disabled={gemmaExplanationLoading}
                    title="Get execution sequence guidance without spoilers"
                  >
                    <Search size={12} />
                    <span>{gemmaExplanationLoading ? 'Generating…' : 'Ask Gemma for execution guidance (no spoilers)'}</span>
                  </button>
                ) : (
                  <button
                    className="ws-btn ws-btn-primary compact"
                    onClick={() => onRequestGemmaExplanation(true)}
                    disabled={gemmaExplanationLoading}
                    title="Request full execution and bug explanation from Gemma 4"
                  >
                    <BookOpen size={12} />
                    <span>{gemmaExplanationLoading ? 'Explaining…' : 'Request full execution & bug explanation from Gemma'}</span>
                  </button>
                )}
              </div>

              {gemmaExplanationLoading && (
                <div className="ws-gemma-eval-box loading">
                  <Sparkles size={14} className="spin text-purple-bright" />
                  <span>Gemma 4 is formulating execution explanation…</span>
                </div>
              )}

              {gemmaExplanation && !gemmaExplanationLoading && (
                <div className="ws-gemma-eval-box">
                  <div className="ws-eval-head">
                    <Sparkles size={14} className="text-purple-bright" />
                    <span>Gemma 4 Execution Explanation</span>
                  </div>
                  <div className="ws-eval-body">
                    {gemmaExplanation.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('\n').map((line, lIdx) => (
                          <span key={lIdx}>
                            {line}
                            {lIdx < paragraph.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
