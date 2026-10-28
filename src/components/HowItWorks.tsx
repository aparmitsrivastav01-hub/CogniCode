import { DemoPlayer } from './DemoPlayer';

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface HowItWorksProps {
  className?: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    title: 'Understand',
    description: 'Read a multi-file codebase and explain it in your words.',
  },
  {
    title: 'Run Tests',
    description: 'Run the tests in the browser and read the failures.',
  },
  {
    title: 'Find Bug',
    description: 'Mark the faulty line across files; hints are limited to 3.',
  },
  {
    title: 'Predict & Explain',
    description: 'Predict the output and get a score per stage.',
  },
];

export function HowItWorks({ className = '' }: HowItWorksProps) {
  return (
    <section id="how-it-works" className={`how-it-works-section ${className}`}>
      {/* Section Header */}
      <div className="section-heading text-center">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          WORKFLOW
        </span>
        <h2>How CogniCode works</h2>
        <p className="how-it-works-subtitle">
          A four-stage debugging loop designed to build deep code comprehension.
        </p>
      </div>

      {/* Demo Player on Top */}
      <div className="how-it-works-demo-wrap">
        <DemoPlayer />
      </div>

      {/* 4 Steps in a Responsive Grid below */}
      <div className="how-it-works-grid" role="list">
        {howItWorksSteps.map((step, idx) => (
          <article
            key={step.title}
            className="how-it-works-card"
            role="listitem"
          >
            <div className="how-it-works-step-num">
              {(idx + 1).toString().padStart(2, '0')}
            </div>
            <h3 className="how-it-works-step-title">{step.title}</h3>
            <p className="how-it-works-step-desc">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
