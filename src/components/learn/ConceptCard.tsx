import { ArrowRight, Code, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Concept } from '../../data/concepts';
import { Badge, type BadgeProps } from '../page/Badge';
import { Card } from '../page/Card';

export interface ConceptCardProps {
  concept: Concept;
  onSelect: (concept: Concept) => void;
  className?: string;
}

export function ConceptCard({ concept, onSelect, className = '' }: ConceptCardProps) {
  const getDifficultyVariant = (diff: Concept['difficulty']): BadgeProps['variant'] => {
    switch (diff) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warn';
      case 'Hard':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <Card
      className={`concept-card ${className}`}
      hoverable
      onClick={() => onSelect(concept)}
    >
      <div className="concept-card-header">
        <div className="concept-tags">
          <Badge label={concept.category} variant="accent" />
          <Badge label={concept.difficulty} variant={getDifficultyVariant(concept.difficulty)} />
        </div>
        <button
          type="button"
          className="concept-inspect-btn"
          aria-label={`Inspect ${concept.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(concept);
          }}
        >
          <Eye size={14} />
          <span>Compare Diff</span>
        </button>
      </div>

      <div className="concept-card-body">
        <h3 className="concept-title">{concept.title}</h3>
        <p className="concept-summary">{concept.summary}</p>
      </div>

      <div className="concept-card-footer">
        <div className="concept-code-preview">
          <Code size={13} className="code-icon" />
          <span>Interactive Bug vs Fix</span>
        </div>

        {concept.relatedChallengeSlug ? (
          <Link
            to={`/challenge/${concept.relatedChallengeSlug}`}
            className="concept-challenge-link active"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Solve challenge</span>
            <ArrowRight size={13} />
          </Link>
        ) : (
          <span
            className="concept-challenge-link disabled"
            title="Challenge coming soon for this concept"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Round planned</span>
          </span>
        )}
      </div>
    </Card>
  );
}
