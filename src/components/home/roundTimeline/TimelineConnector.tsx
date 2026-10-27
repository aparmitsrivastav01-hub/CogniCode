export interface TimelineConnectorProps {
  progressPercent: number; // 0 to 100
  className?: string;
}

export function TimelineConnector({ progressPercent, className = '' }: TimelineConnectorProps) {
  return (
    <div className={`timeline-connector-track ${className}`} aria-hidden="true">
      <div
        className="timeline-connector-fill"
        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
      />
    </div>
  );
}
