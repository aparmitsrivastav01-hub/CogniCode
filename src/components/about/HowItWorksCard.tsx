import { Workflow, Bug, BookOpen } from 'lucide-react';
import type { HowItWorksStep } from '../../data/about';
import { Card } from '../page/Card';

export interface HowItWorksCardProps {
  step: HowItWorksStep;
}

const iconMap = {
  Workflow,
  Bug,
  BookOpen,
};

export function HowItWorksCard({ step }: HowItWorksCardProps) {
  const IconComponent = iconMap[step.iconName] || Workflow;

  return (
    <Card hoverable className="how-it-works-card">
      <div className="how-it-works-icon-wrap">
        <IconComponent size={20} />
      </div>
      <h3 className="how-it-works-title">{step.title}</h3>
      <p className="how-it-works-desc">{step.description}</p>
    </Card>
  );
}
