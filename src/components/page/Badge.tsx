export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warn' | 'accent' | 'purple';
  className?: string;
}

export function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`page-badge ${variant} ${className}`}>
      {label}
    </span>
  );
}
