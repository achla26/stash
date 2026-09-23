import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
}

export function SidebarNavItem({
  item,
  isActive,
  onClose,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <div className="flex items-center justify-between rounded-xl px-4 py-3 text-muted-foreground opacity-60">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{item.label}</span>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
}