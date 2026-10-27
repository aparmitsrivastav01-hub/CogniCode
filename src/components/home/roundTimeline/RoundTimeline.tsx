import { useEffect, useRef, useState } from 'react';
import { roundSteps, type RoundStepId } from '../../../data/roundSteps';
import { TimelineConnector } from './TimelineConnector';
import { TimelineStep } from './TimelineStep';

export interface TimelineProps {
  className?: string;
}

export function RoundTimeline({ className = '' }: TimelineProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [expandedStepId, setExpandedStepId] = useState<RoundStepId | null>(null);
  const [isInView, setIsInView] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setActiveStepIndex(4);
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Progressive fill animation when section scrolls into view
  useEffect(() => {
    if (!isInView) return;

    const timer1 = setTimeout(() => setActiveStepIndex(1), 150);
    const timer2 = setTimeout(() => setActiveStepIndex(2), 350);
    const timer3 = setTimeout(() => setActiveStepIndex(3), 550);
    const timer4 = setTimeout(() => setActiveStepIndex(4), 750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isInView]);

  const toggleExpand = (id: RoundStepId) => {
    setExpandedStepId((prev) => (prev === id ? null : id));
  };

  // Progress percentage for connector line (steps 1 through 4)
  // 1 active = ~25%, 2 active = ~50%, 3 active = ~75%, 4 active = 100%
  const progressPercent = activeStepIndex === 0 ? 0 : ((activeStepIndex - 1) / 3) * 100;

  return (
    <section ref={sectionRef} className={`round-timeline-section ${className}`}>
      {/* SECTION HEADING */}
      <div className="timeline-header">
        <span className="eyebrow">HOW A ROUND WORKS</span>
        <h2 className="timeline-title">Four steps. One round.</h2>
        <p className="timeline-subtitle">
          Every challenge follows the same loop, so you build a habit, not a trick.
        </p>
      </div>

      {/* TIMELINE CONTAINER */}
      <div className={`timeline-container ${isInView ? 'animated-in' : ''}`}>
        {/* DESKTOP CONNECTING TRACK */}
        <div className="timeline-track-wrapper">
          <TimelineConnector progressPercent={progressPercent} />
        </div>

        {/* 4 STEPS GRID / ROW */}
        <div className="timeline-steps-row">
          {roundSteps.map((step, idx) => (
            <TimelineStep
              key={step.id}
              step={step}
              isActive={activeStepIndex >= step.order}
              isExpanded={expandedStepId === step.id}
              onToggle={toggleExpand}
              animationDelayMs={idx * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
