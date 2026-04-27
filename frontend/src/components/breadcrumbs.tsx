interface BreadcrumbCrumb {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  crumbs: BreadcrumbCrumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index}>
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page" title={crumb.label}>
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  className="breadcrumb-link"
                  onClick={crumb.onClick}
                  title={crumb.label}
                >
                  {crumb.label}
                </button>
              )}
              {!isLast && (
                <span aria-hidden="true" className="breadcrumb-separator">
                  {' '}
                  ›{' '}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
