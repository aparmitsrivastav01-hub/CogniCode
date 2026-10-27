export interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
}

export function Chip({ label, active = false, onClick, count, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      className={`page-chip ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{label}</span>
      {count !== undefined && <span className="page-chip-count">{count}</span>}
    </button>
  );
}
