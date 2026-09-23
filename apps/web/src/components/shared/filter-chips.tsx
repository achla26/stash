"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: "primary" | "accent";
}

export function FilterChip({
  label,
  isActive,
  onClick,
  variant = "primary",
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
        isActive && variant === "primary"
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : isActive && variant === "accent"
            ? "border-primary bg-accent text-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

interface FilterChipGroupProps {
  items: string[];
  active: string;
  onSelect: (value: string) => void;
  variant?: "primary" | "accent";
}

export function FilterChipGroup({
  items,
  active,
  onSelect,
  variant = "primary",
}: FilterChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <FilterChip
          key={item}
          label={item}
          isActive={active === item}
          onClick={() => onSelect(item)}
          variant={variant}
        />
      ))}
    </div>
  );
}