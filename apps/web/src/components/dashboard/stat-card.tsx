import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: StatCardProps) {
  return (
    <div className="glass card-hover rounded-xl border border-border p-4 md:p-5">
      <div className="mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bgClass)}>
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}