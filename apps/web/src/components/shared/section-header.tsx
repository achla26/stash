interface SectionHeaderProps {
  title: string;
  href?: string;
  actionLabel?: string;
}

export function SectionHeader({
  title,
  href,
  actionLabel = "View all",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {href && (
        <a
          href={href}
          className="text-sm text-primary transition-opacity hover:underline hover:opacity-80"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}