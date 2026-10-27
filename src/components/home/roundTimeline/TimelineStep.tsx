import { ChevronDown, BookOpen, Bug, ShieldCheck, Workflow } from 'lucide-react';
import type { RoundStep, RoundStepId } from '../../../data/roundSteps';
import { EstimateChip } from './EstimateChip';

export interface TimelineStepProps {
  step: RoundStep;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (id: RoundStepId) => void;
  animationDelayMs?: number;
  className?: string;
}

const STEP_ICONS = {
  Workflow,
  Bug,
  BookOpen,
  ShieldCheck,
};

export function TimelineStep({
  step,
  isActive,
  isExpanded,
  onToggle,
  animationDelayMs = 0,
  className = '',
}: TimelineStepProps) {
  const IconComponent = STEP_ICONS[step.icon] ?? Workflow;

  return (
    <div
      className={`timeline-step-column ${isActive ? 'is-active' : ''} ${className}`}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      {/* BADGE ON THE TIMELINE */}
      <div className="timeline-badge-wrapper">
        <div className="timeline-badge" aria-label={`Step ${step.order}`}>
          <span className="badge-number">{step.order}</span>
        </div>
      </div>

      {/* STEP CARD */}
      <div
        className={`timeline-card ${isExpanded ? 'is-expanded' : ''}`}
        onClick={() => onToggle(step.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(step.id);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${step.title} step. Click to toggle example.`}
      >
        <div className="card-top">
          <div className="card-icon-box">
            <IconComponent size={18} />
          </div>
          <EstimateChip estimate={step.estimate} />
        </div>

        <h3 className="card-title">{step.title}</h3>
        <p className="card-desc">{step.description}</p>

        {/* EXPANDABLE CONCRETE EXAMPLE */}
        <div className="card-expand-toggle">
          <span className="expand-label">
            {isExpanded ? 'Hide example' : 'View example'}
          </span>
          <ChevronDown
            size={13}
            className={`expand-chevron ${isExpanded ? 'rotated' : ''}`}
          />
        </div>

        {isExpanded && (
          <div className="card-example-drawer">
            <div className="example-tag">EXAMPLE</div>
            <p className="example-text">{step.example}</p>
          </div>
        )}
      </div>
    </div>
  );
}
