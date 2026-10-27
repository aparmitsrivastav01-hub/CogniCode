export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`section-heading-block ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          {eyebrow}
        </div>
      )}
      <h2 className="section-heading-title">{title}</h2>
      {subtitle && <p className="section-heading-subtitle">{subtitle}</p>}
    </div>
  );
}
