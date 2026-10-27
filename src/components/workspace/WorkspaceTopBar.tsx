import { ArrowLeft, ArrowRight, Circle, Clock, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

export type WorkspaceStep = 'predict' | 'debug' | 'explain';

export interface WorkspaceTopBarProps {
  category: string;
  roundTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  activeStep: WorkspaceStep;
  onStepChange: (step: WorkspaceStep) => void;
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
  activeStep,
  onStepChange,
  runtimeStatus,
  formattedTime,
  hintsRevealedCount,
  totalHintsCount,
  onRevealHint,
  onSubmit,
  locked,
}: WorkspaceTopBarProps) {
  const steps: { key: WorkspaceStep; label: string }[] = [
    { key: 'predict', label: '1. Predict' },
    { key: 'debug', label: '2. Debug' },
    { key: 'explain', label: '3. Explain' },
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

      {/* Center-left: Step navigation pills */}
      <div className="ws-stepper" role="tablist" aria-label="Solving process steps">
        {steps.map(step => {
          const isActive = activeStep === step.key;
          return (
            <button
              key={step.key}
              role="tab"
              aria-selected={isActive}
              className={`ws-step-pill ${isActive ? 'active' : ''}`}
              onClick={() => onStepChange(step.key)}
            >
              <Circle size={6} className={`ws-step-dot ${isActive ? 'active' : ''}`} fill="currentColor" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ws-topbar-spacer" />

      {/* Right: Runtime chip + Timer + Hints + Submit button */}
      <div className="ws-topbar-right">
        <div className={`ws-runtime-chip ${runtimeStatus}`}>
          <span className="ws-runtime-dot" />
          <span>
            {runtimeStatus === 'ready'
              ? 'Python 3.12 Ready'
              : runtimeStatus === 'loading'
              ? 'Python runtime loading'
              : 'Python Offline'}
          </span>
        </div>

        <div className="ws-timer-chip">
          <Clock size={13} />
          <span>{formattedTime}</span>
        </div>

        <button
          className="ws-btn ws-btn-quiet"
          onClick={onRevealHint}
          disabled={locked}
          title="Reveal a hint"
        >
          <Lightbulb size={14} />
          <span>Hints ({hintsRevealedCount}/{totalHintsCount})</span>
        </button>

        <button
          className="ws-btn ws-btn-primary"
          onClick={onSubmit}
          disabled={locked}
        >
          <span>Submit answer</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </header>
  );
}
