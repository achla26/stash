export default function Divider(description :string | null = '') {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {description}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
    </div>
  );
}