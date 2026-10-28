import { ArrowLeft, Clock, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  runtimeStatus,
  formattedTime,
  hintsRevealedCount,
  totalHintsCount,
  onRevealHint,
  onSubmit,
  locked,
}: WorkspaceTopBarProps) {
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
