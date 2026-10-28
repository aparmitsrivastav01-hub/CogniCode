import { ArrowLeft, Clock, Lightbulb, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WorkflowStageId, StageStatus } from '../../types/round';

export type WorkspaceStep =
  | 'understand'
  | 'plan'
  | 'test'
  | 'investigate'
  | 'verify'
  | 'explain'
  | 'predict'
  | 'debug';

export interface WorkspaceTopBarProps {
  category: string;
  roundTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  activeStep?: WorkspaceStep;
  onStepChange?: (step: WorkspaceStep) => void;
  activeStage?: WorkflowStageId;
  stageStatuses?: Record<WorkflowStageId, StageStatus>;
  onStageChange?: (stage: WorkflowStageId) => void;
  runtimeStatus: 'loading' | 'ready' | 'offline';
  formattedTime: string;
  hintsRevealedCount: number;
  totalHintsCount: number;
  onRevealHint: () => void;
  onSubmit: () => void;
  locked: boolean;
}

export function WorkspaceTopBar({
  category,
  roundTitle,
  difficulty,
  activeStage = 'understand',
  stageStatuses = {
    understand: 'in_progress',
    test: 'locked',
    find_bug: 'locked',
    predict_explain: 'locked',
  },
  onStageChange,
  runtimeStatus,
  formattedTime,
  hintsRevealedCount,
  totalHintsCount,
  onRevealHint,
  onSubmit,
  locked,
}: WorkspaceTopBarProps) {
  const stages: { id: WorkflowStageId; num: string; label: string }[] = [
    { id: 'understand', num: '01', label: 'Understand' },
    { id: 'test', num: '02', label: 'Run Tests' },
    { id: 'find_bug', num: '03', label: 'Find Bug' },
    { id: 'predict_explain', num: '04', label: 'Predict & Explain' },
  ];

  return (
    <header className="ws-topbar">
      {/* Left: Back + Breadcrumb + Difficulty Pill */}
      <div className="ws-topbar-left">
        <Link to="/challenges" className="ws-back-btn" aria-label="Back to Challenges">
          <ArrowLeft size={14} />
          <span>Challenges</span>
        </Link>
        <span className="ws-topbar-divider" />
        <div className="ws-breadcrumb">
          <span className="ws-breadcrumb-cat">{category}</span>
          <span className="ws-breadcrumb-sep">/</span>
          <strong className="ws-breadcrumb-title">{roundTitle}</strong>
        </div>
        <span className={`ws-diff-pill ${difficulty.toLowerCase()}`}>
          {difficulty}
        </span>
      </div>

      {/* Center: Compact Stage Navigator */}
      <div className="ws-topbar-stages">
        {stages.map((st, idx) => {
          const status = stageStatuses[st.id] || 'locked';
          const isActive = activeStage === st.id;
          const isLocked = status === 'locked';

          return (
            <div key={st.id} className="ws-topbar-stage-wrap">
              <button
                className={`ws-topbar-stage-pill ${status} ${isActive ? 'active' : ''}`}
                disabled={isLocked}
                onClick={() => onStageChange?.(st.id)}
                title={`${st.num} ${st.label} (${status.replace('_', ' ')})`}
              >
                <span className="ws-stage-num">{st.num}</span>
                <span className="ws-stage-name">{st.label}</span>
                <span className="ws-stage-status">
                  {status === 'locked' && <Lock size={10} />}
                  {status === 'completed' && <CheckCircle2 size={11} className="text-green-bright" />}
                  {status === 'needs_revision' && <AlertTriangle size={11} className="text-amber-bright" />}
                </span>
              </button>
              {idx < stages.length - 1 && <span className="ws-stage-sep">→</span>}
            </div>
          );
        })}
      </div>

      {/* Right: Runtime chip + Timer + Hints + Submit button */}
      <div className="ws-topbar-right">
        {/* Python 3.12 Status Chip */}
        <div className={`ws-runtime-chip ${runtimeStatus}`}>
          <span className="runtime-dot" />
          <span>
            {runtimeStatus === 'ready'
              ? 'Python 3.12 Ready'
              : runtimeStatus === 'loading'
              ? 'Loading Pyodide…'
              : 'Python Offline'}
          </span>
        </div>

        {/* Timer Chip */}
        <div className="ws-timer-chip">
          <Clock size={13} className="timer-icon" />
          <span>{formattedTime}</span>
        </div>

        {/* Hints Button */}
        <button
          className="ws-hints-btn"
          onClick={onRevealHint}
          disabled={locked || hintsRevealedCount >= totalHintsCount}
          title="Reveal Next Hint"
        >
          <Lightbulb size={13} className="hint-icon" />
          <span>
            Hints ({hintsRevealedCount}/{totalHintsCount})
          </span>
        </button>

        {/* Submit Button */}
        <button
          className="ws-submit-btn"
          onClick={onSubmit}
          disabled={locked}
          title="Submit solution"
        >
          <span>Submit answer</span>
          <span className="ws-submit-arrow">→</span>
        </button>
      </div>
    </header>
  );
}
