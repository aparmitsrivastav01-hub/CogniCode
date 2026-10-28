import {
  Check,
  CheckCircle2,
  Code2,
  Play,
  Terminal,
  Lock,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Search,
  RotateCcw,
  ArrowRight,
  Eye,
} from 'lucide-react';
import type {
  Challenge,
  BugAnswer,
  TestReport,
  VerificationStatus,
  WorkflowStageId,
  StageStatus,
} from '../../types/round';

export type WorkspaceBottomTab = WorkflowStageId;

export interface WorkspaceBottomPanelProps {
  challenge: Challenge;
  activeStage: WorkflowStageId;
  onStageChange: (stage: WorkflowStageId) => void;
  stageStatuses: Record<WorkflowStageId, StageStatus>;

  // Stage 1: Understand
  understandingText: string;
  onUnderstandingTextChange: (text: string) => void;
  onEvaluateUnderstanding: () => void;
  understandingLoading: boolean;
  understandingFeedback: string;
  understandingAccepted: boolean;

  // Stage 2: Tests
  onRunTests: () => void;
  testRunning: boolean;
  testReport: TestReport | null;
  gemmaTestExplanation: string;
  gemmaTestLoading: boolean;
  onAskGemmaTestHelp: () => void;

  // Stage 3: Find Bug
  markedBug: BugAnswer | null;
  onClearMark: () => void;
  bugExplanation: string;
  onBugExplanationChange: (text: string) => void;
  onEvaluateBugDiagnosis: () => void;
  bugLoading: boolean;
  bugFeedback: string;
  bugAccepted: boolean;

  // Stage 4: Predict & Explain
  entryFile: string;
  outputAnswer: string;
  onOutputAnswerChange: (value: string) => void;
  outputExplanation: string;
  onOutputExplanationChange: (value: string) => void;
  onCheckOutput: () => void;
  checkingOutput: boolean;
  revealedOutput: string | null;
  outputFeedback: string;
  outputCorrect: boolean;
  outputAttempts: number;
  gemmaPredictionFeedback: string;
  gemmaPredictionLoading: boolean;
  onRunEntry: () => void;

  // Global / Runtime
  runtimeState: 'loading' | 'ready' | 'offline';
  runtimeError: string;
  locked: boolean;
  onSubmit: () => void;
}

export function WorkspaceBottomPanel({
  challenge,
  activeStage,
  onStageChange,
  stageStatuses,
  understandingText,
  onUnderstandingTextChange,
  onEvaluateUnderstanding,
  understandingLoading,
  understandingFeedback,
  understandingAccepted,
  onRunTests,
  testRunning,
  testReport,
  gemmaTestExplanation,
  gemmaTestLoading,
  onAskGemmaTestHelp,
  markedBug,
  onClearMark,
  bugExplanation,
  onBugExplanationChange,
  onEvaluateBugDiagnosis,
  bugLoading,
  bugFeedback,
  bugAccepted,
  entryFile,
  outputAnswer,
  onOutputAnswerChange,
  outputExplanation,
  onOutputExplanationChange,
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
  onSubmit,
}: WorkspaceBottomPanelProps) {
  const stageNavItems: {
    id: WorkflowStageId;
    stepNumber: string;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'understand', stepNumber: '01', label: 'Understand', icon: <BookOpen size={13} /> },
    { id: 'test', stepNumber: '02', label: 'Run Tests', icon: <Code2 size={13} /> },
    { id: 'find_bug', stepNumber: '03', label: 'Find Bug', icon: <Search size={13} /> },
    { id: 'predict_explain', stepNumber: '04', label: 'Predict & Explain', icon: <Terminal size={13} /> },
  ];

  const understandingWordCount = understandingText.trim()
    ? understandingText.trim().split(/\s+/).length
    : 0;
  const bugWordCount = bugExplanation.trim() ? bugExplanation.trim().split(/\s+/).length : 0;
  const outputWordCount = outputExplanation.trim() ? outputExplanation.trim().split(/\s+/).length : 0;
  const entryModule = entryFile.replace('.py', '').replace(/\//g, '.');

  // Compute test verification status
  let verificationStatus: VerificationStatus = 'not_verified';
  let verificationTitle = 'Not yet verified';
  let verificationMessage = 'Run the unit tests to collect genuine execution evidence.';

  if (testReport) {
    if (testReport.error && testReport.results.length === 0) {
      verificationStatus = 'failed';
      verificationTitle = 'Execution error';
      verificationMessage = `Python test runner failed: ${testReport.error}`;
    } else {
      const failedList = testReport.results.filter(r => r.status === 'failed');
      if (failedList.length > 0) {
        verificationStatus = 'failed';
        verificationTitle = `${failedList.length} Failed, ${testReport.results.length - failedList.length} Passed`;
        verificationMessage = `${failedList.length} of ${testReport.results.length} unit test(s) failed in Python unittest (expected in buggy codebase).`;
      } else if (testReport.results.length > 0) {
        if (markedBug) {
          verificationStatus = 'passed';
          verificationTitle = 'All Passed';
          verificationMessage = `All ${testReport.results.length} unit test(s) passed and root-cause bug marked.`;
        } else {
          verificationStatus = 'incomplete';
          verificationTitle = 'Tests Passed (Bug Unmarked)';
          verificationMessage = `All ${testReport.results.length} unit test(s) passed, but root-cause bug has not yet been marked.`;
        }
      }
    }
  }

  const failedTests = testReport?.results.filter(r => r.status === 'failed') || [];

  return (
    <div className="ws-bottom-panel">
      {/* 4-Stage Navigator Header */}
      <div className="ws-stage-navigator" role="tablist">
        {stageNavItems.map(item => {
          const status = stageStatuses[item.id] || 'locked';
          const isActive = activeStage === item.id;
          const isLocked = status === 'locked';

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              disabled={isLocked}
              className={`ws-stage-tab ${status} ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (!isLocked) onStageChange(item.id);
              }}
              title={
                isLocked
                  ? `Locked: Complete previous stage first`
                  : `Switch to ${item.label} (${status.replace('_', ' ')})`
              }
            >
              <span className="ws-stage-step-num">{item.stepNumber}</span>
              <span className="ws-stage-icon">{item.icon}</span>
              <span className="ws-stage-label">{item.label}</span>

              {/* Status Indicator */}
              <span className="ws-stage-status-badge">
                {status === 'locked' && <Lock size={11} className="ws-badge-icon locked" />}
                {status === 'completed' && <CheckCircle2 size={12} className="ws-badge-icon completed" />}
                {status === 'needs_revision' && <AlertTriangle size={12} className="ws-badge-icon revision" />}
                {status === 'in_progress' && <span className="ws-stage-dot active" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Drawer */}
      <div className="ws-bottom-content">
        {/* ============================================================ */}
        {/* STAGE 1: UNDERSTAND THE CODE                                  */}
        {/* ============================================================ */}
        {activeStage === 'understand' && (
          <div className="ws-stage-content">
            <div className="ws-scenario-card">
              <div className="ws-scenario-head">
                <span className="ws-scenario-tag">STAGE 1: UNDERSTAND THE CODE</span>
                <code className="ws-scenario-cmd">python -m {entryModule}</code>
              </div>
              <div className="ws-scenario-context">
                <strong>Program Context:</strong> {challenge.structuredDescription?.context || challenge.description}
              </div>
              <p className="ws-scenario-prompt">
                Before debugging, explain how this program processes input, identifies existing elements or state, and executes operations. Describe the expected behaviour in your own words.
              </p>
            </div>

            <div className="ws-explain-top">
              <label className="ws-tool-helper">
                Your explanation of the program workflow and expected behaviour:
              </label>
              <span className="ws-word-count">{understandingWordCount} words</span>
            </div>
            <textarea
              className="ws-explain-textarea"
              rows={4}
              placeholder="Explain what the program is supposed to do, how functions and loops work, how data flows through the files, and what behavior you expect..."
              value={understandingText}
              onChange={e => onUnderstandingTextChange(e.target.value)}
              disabled={locked || understandingLoading}
            />

            <div className="ws-stage-actions-bar">
              <button
                className="ws-btn ws-btn-primary"
                onClick={onEvaluateUnderstanding}
                disabled={locked || understandingLoading || !understandingText.trim()}
              >
                <Sparkles size={13} className={understandingLoading ? 'spin' : ''} />
                <span>{understandingLoading ? 'Evaluating with Gemma 4…' : 'Submit explanation'}</span>
              </button>

              {understandingAccepted && (
                <button
                  className="ws-btn ws-btn-proceed"
                  onClick={() => onStageChange('test')}
                >
                  <span>Proceed to Run Tests</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {understandingLoading && (
              <div className="ws-gemma-eval-box loading">
                <Sparkles size={14} className="spin text-purple-bright" />
                <span>Gemma 4 is reviewing your conceptual understanding…</span>
              </div>
            )}

            {understandingFeedback && !understandingLoading && (
              <div
                className={`ws-gemma-eval-box ${
                  understandingAccepted ? 'verdict-accepted' : 'verdict-revision'
                }`}
              >
                <div className="ws-eval-head">
                  <Sparkles size={14} className="text-purple-bright" />
                  <span>Gemma 4 Understanding Evaluation</span>
                  <span
                    className={`ws-verdict-badge ${
                      understandingAccepted ? 'accepted' : 'revision'
                    }`}
                  >
                    {understandingAccepted ? '✓ Accepted' : '⚠️ Revision Suggested'}
                  </span>
                </div>
                <div className="ws-eval-body">
                  {understandingFeedback.split('\n\n').map((paragraph, pIdx) => (
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
        )}

        {/* ============================================================ */}
        {/* STAGE 2: RUN TEST CASES                                      */}
        {/* ============================================================ */}
        {activeStage === 'test' && (
          <div className="ws-stage-content">
            <div className="ws-tests-header">
              <div>
                <div className="ws-stage-title-sm">STAGE 2: RUN TEST CASES</div>
                <span className="ws-tool-helper">
                  Execute the unit test suite in <code>tests/</code> with Python unittest. Failing tests are expected in intentionally buggy code.
                </span>
              </div>
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
                  <span>{testRunning ? 'Running…' : testReport ? 'Rerun tests' : 'Run tests'}</span>
                </button>
                {testReport && (
                  <button
                    className="ws-btn ws-btn-proceed compact"
                    onClick={() => onStageChange('find_bug')}
                  >
                    <span>Proceed to Find Bug</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Verification Status Banner */}
            <div className={`ws-verification-banner ${verificationStatus}`}>
              <div className="ws-verification-icon-wrap">
                {verificationStatus === 'passed' && <CheckCircle2 size={16} />}
                {verificationStatus === 'failed' && <AlertCircle size={16} />}
                {verificationStatus === 'incomplete' && <AlertCircle size={16} />}
                {verificationStatus === 'not_verified' && <HelpCircle size={16} />}
              </div>
              <div className="ws-verification-body">
                <div className="ws-verification-heading">
                  <span className="ws-verification-status-tag">{verificationTitle}</span>
                  <span className="ws-verification-sub">CogniCode Test Execution Evidence</span>
                </div>
                <div className="ws-verification-text">{verificationMessage}</div>
              </div>
            </div>

            {/* Gemma Test Interpretation */}
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
                      {test.status === 'passed' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
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

        {/* ============================================================ */}
        {/* STAGE 3: FIND AND MARK THE BUG                               */}
        {/* ============================================================ */}
        {activeStage === 'find_bug' && (
          <div className="ws-stage-content">
            <div className="ws-findbug-guidance">
              <div className="ws-stage-title-sm">STAGE 3: FIND AND MARK THE BUG</div>
              <p className="ws-tool-helper">
                Inspect the active file in the editor and click any line number in the gutter to mark your suspected root-cause bug.
              </p>
              {failedTests.length > 0 && (
                <div className="ws-affected-evidence">
                  <strong>Observed failure:</strong> <code>{failedTests[0].name}</code>
                  {challenge.expectedInvariants?.[0] && (
                    <span> — Expected invariant: {challenge.expectedInvariants[0]}</span>
                  )}
                </div>
              )}
            </div>

            {/* Marked Line Bar */}
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
              </div>
            ) : (
              <div className="ws-unmarked-msg">
                No line currently marked in active file. Click a line number in the gutter to record your suspected bug.
              </div>
            )}

            {/* Bug Diagnosis Explanation */}
            <div className="ws-explain-top">
              <label className="ws-tool-helper">
                Explain why this marked code or logic is incorrect and what bug it causes:
              </label>
              <span className="ws-word-count">{bugWordCount} words</span>
            </div>
            <textarea
              className="ws-explain-textarea"
              rows={3}
              placeholder="Explain what the marked line does wrong, what invariant is broken, and why this causes the observed test failure..."
              value={bugExplanation}
              onChange={e => onBugExplanationChange(e.target.value)}
              disabled={locked || bugLoading}
            />

            <div className="ws-stage-actions-bar">
              <button
                className="ws-btn ws-btn-primary"
                onClick={onEvaluateBugDiagnosis}
                disabled={locked || bugLoading || !markedBug}
              >
                <Sparkles size={13} className={bugLoading ? 'spin' : ''} />
                <span>{bugLoading ? 'Evaluating diagnosis with Gemma 4…' : 'Evaluate bug diagnosis'}</span>
              </button>

              {bugAccepted && (
                <button
                  className="ws-btn ws-btn-proceed"
                  onClick={() => onStageChange('predict_explain')}
                >
                  <span>Proceed to Predict & Explain</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {bugLoading && (
              <div className="ws-gemma-eval-box loading">
                <Sparkles size={14} className="spin text-purple-bright" />
                <span>Gemma 4 is analyzing your marked bug and reasoning…</span>
              </div>
            )}

            {bugFeedback && !bugLoading && (
              <div
                className={`ws-gemma-eval-box ${
                  bugAccepted ? 'verdict-accepted' : 'verdict-revision'
                }`}
              >
                <div className="ws-eval-head">
                  <Sparkles size={14} className="text-purple-bright" />
                  <span>Gemma 4 Bug Diagnosis Evaluation</span>
                  <span className={`ws-verdict-badge ${bugAccepted ? 'accepted' : 'revision'}`}>
                    {bugAccepted ? '✓ Diagnosis Consistent' : '💡 Contextual Hint'}
                  </span>
                </div>
                <div className="ws-eval-body">
                  {bugFeedback.split('\n\n').map((paragraph, pIdx) => (
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
        )}

        {/* ============================================================ */}
        {/* STAGE 4: PREDICT AND EXPLAIN OUTPUT                          */}
        {/* ============================================================ */}
        {activeStage === 'predict_explain' && (
          <div className="ws-stage-content">
            <div className="ws-scenario-card">
              <div className="ws-scenario-head">
                <span className="ws-scenario-tag">STAGE 4: PREDICT AND EXPLAIN OUTPUT</span>
                <code className="ws-scenario-cmd">python -m {entryModule}</code>
              </div>
              <div className="ws-scenario-context">
                <strong>Context:</strong> {challenge.structuredDescription?.context || challenge.description}
              </div>
              <p className="ws-scenario-prompt">
                What do you think the program will output, and why does this output occur under the current logic?
              </p>
            </div>

            {/* Two-Part Response Form */}
            <div className="ws-two-part-form">
              <div className="ws-part-section">
                <label className="ws-part-label">
                  <strong>A. Predicted Output:</strong> Enter expected stdout or return value
                </label>
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
                </div>
              </div>

              <div className="ws-part-section">
                <div className="ws-explain-top">
                  <label className="ws-part-label">
                    <strong>B. Explanation of the Output:</strong> Explain why this output occurs
                  </label>
                  <span className="ws-word-count">{outputWordCount} words</span>
                </div>
                <textarea
                  className="ws-explain-textarea"
                  rows={3}
                  placeholder="Explain why this output occurs. Trace the relevant execution steps and describe how the program's current logic produces this result..."
                  value={outputExplanation}
                  onChange={e => onOutputExplanationChange(e.target.value)}
                  disabled={locked || checkingOutput}
                />
              </div>
            </div>

            <div className="ws-stage-actions-bar">
              <button
                className="ws-btn ws-btn-primary"
                onClick={onCheckOutput}
                disabled={locked || runtimeState !== 'ready' || checkingOutput || !outputAnswer.trim()}
              >
                <Sparkles size={13} className={checkingOutput ? 'spin' : ''} />
                <span>{checkingOutput ? 'Verifying with Gemma 4…' : 'Submit prediction & explanation'}</span>
              </button>

              {outputAttempts > 0 && (
                <button
                  className="ws-btn ws-btn-outline"
                  onClick={onRunEntry}
                  disabled={locked || runtimeState !== 'ready' || checkingOutput}
                  title="Run Python entry to view actual raw stdout"
                >
                  <Eye size={13} />
                  <span>Reveal live stdout</span>
                </button>
              )}

              {outputAttempts > 0 && (
                <button
                  className="ws-btn ws-btn-finish"
                  onClick={onSubmit}
                  disabled={locked}
                  title="Submit all answers and complete challenge"
                >
                  <span>Complete & Submit Answer</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Validation Feedback Banner */}
            {outputFeedback && (
              <div className={`ws-feedback-msg ${outputCorrect ? 'success' : 'warn'}`}>
                {outputCorrect ? <Check size={14} /> : <AlertTriangle size={14} />}
                <span>{outputFeedback}</span>
              </div>
            )}

            {/* Gemma 4 Evaluation Callout */}
            {gemmaPredictionLoading && (
              <div className="ws-gemma-eval-box loading">
                <Sparkles size={14} className="spin text-purple-bright" />
                <span>Gemma 4 is evaluating your prediction and reasoning against execution evidence…</span>
              </div>
            )}

            {gemmaPredictionFeedback && !gemmaPredictionLoading && (
              <div className="ws-gemma-eval-box">
                <div className="ws-eval-head">
                  <Sparkles size={14} className="text-purple-bright" />
                  <span>Gemma 4 Prediction & Execution Explanation</span>
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
      </div>
    </div>
  );
}
