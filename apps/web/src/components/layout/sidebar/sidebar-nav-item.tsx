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
  const TINT: Record<string, string> = {
    "/dashboard": "#007AFF",
    "/notebooks": "#AF52DE",
    "/notes": "#34C759",
    "/links": "#0A84FF",
    "/words": "#FF9500",
    "/pad": "#FF3B30",
    "/chat": "#5856D6",
    "/settings": "#8E8E93",
  };
  const tint = TINT[item.href] ?? "#007AFF";

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
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
        style={
          isActive
            ? { backgroundColor: "rgb(255 255 255 / 0.18)" }
            : { backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)` }
        }
      >
        <Icon
          className="h-4 w-4"
          style={isActive ? undefined : { color: tint }}
        />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}