export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, className = '' }: PageHeaderProps) {
  return (
    <div className={`page-header-block ${className}`}>
      <div className="eyebrow">
        <span className="eyebrow-dot" />
        {eyebrow}
      </div>
      <h1 className="page-header-title">{title}</h1>
      {description && <p className="page-header-desc">{description}</p>}
    </div>
  );
}
