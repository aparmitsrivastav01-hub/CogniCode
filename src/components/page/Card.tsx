import type { ReactNode, CSSProperties } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  role?: string;
  tabIndex?: number;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  onClick,
  style,
  role,
  tabIndex,
}: CardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`page-card ${hoverable ? 'hoverable' : ''} ${isClickable ? 'clickable' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={e => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={role || (isClickable ? 'button' : undefined)}
      tabIndex={tabIndex ?? (isClickable ? 0 : undefined)}
      style={style}
    >
      {children}
    </div>
  );
}
