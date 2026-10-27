import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, X, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Concept } from '../../data/concepts';
import { Badge } from '../page/Badge';

export interface ConceptModalProps {
  concept: Concept | null;
  onClose: () => void;
}

export function ConceptModal({ concept, onClose }: ConceptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!concept) return;

    // Save previous active element to restore on close
    const previousActive = document.activeElement as HTMLElement | null;

    // Focus close button on open
    closeButtonRef.current?.focus();

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousActive?.focus();
    };
  }, [concept, onClose]);

  if (!concept) return null;

  return (
    <div
      className="concept-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-concept-title"
    >
      <div
        className="concept-modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="concept-modal-header">
          <div className="modal-header-left">
            <div className="modal-badges">
              <Badge label={concept.category} variant="accent" />
              <Badge label={concept.difficulty} variant="warn" />
            </div>
            <h2 id="modal-concept-title" className="modal-title">
              {concept.title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="concept-modal-body">
          <p className="concept-modal-summary">{concept.summary}</p>

          {/* CODE DIFF COMPARISON */}
          <div className="concept-code-comparison">
            {/* BUGGY SNIPPET */}
            <div className="code-pane buggy-pane">
              <div className="pane-header">
                <div className="pane-label">
                  <XCircle size={14} className="pane-icon bug" />
                  <span>Buggy Implementation</span>
                </div>
                <span className="pane-sub">Defective pattern</span>
              </div>
              <pre className="code-block">
                <code>{concept.buggySnippet}</code>
              </pre>
            </div>

            {/* FIXED SNIPPET */}
            <div className="code-pane fixed-pane">
              <div className="pane-header">
                <div className="pane-label">
                  <CheckCircle2 size={14} className="pane-icon fix" />
                  <span>Corrected Invariant</span>
                </div>
                <span className="pane-sub">Robust pattern</span>
              </div>
              <pre className="code-block">
                <code>{concept.fixedSnippet}</code>
              </pre>
            </div>
          </div>

          {/* EXPLANATION */}
          <div className="concept-modal-explanation">
            <h4>Diagnostic Invariant</h4>
            <p>{concept.explanation}</p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="concept-modal-footer">
          <button type="button" className="modal-secondary-btn" onClick={onClose}>
            Back to concepts
          </button>
          {concept.relatedChallengeSlug && (
            <Link
              to={`/challenge/${concept.relatedChallengeSlug}`}
              className="modal-primary-btn"
              onClick={onClose}
            >
              <span>Practice in Challenge</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
