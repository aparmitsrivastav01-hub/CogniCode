import { Clock } from 'lucide-react';

export interface EstimateChipProps {
  estimate: string;
  className?: string;
}

export function EstimateChip({ estimate, className = '' }: EstimateChipProps) {
  return (
    <span className={`timeline-estimate-chip ${className}`}>
      <Clock size={11} className="estimate-icon" />
      <span>{estimate}</span>
    </span>
  );
}
