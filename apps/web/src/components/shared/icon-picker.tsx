import { ItemIcon, normalizeItemIcon, NOTEBOOK_ICONS } from "@/components/shared/item-icon";
import { cn } from "@/lib/utils";

export function IconPicker({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2" role="group" aria-label="Notebook icon">
    {NOTEBOOK_ICONS.map(icon => <button key={icon} type="button" onClick={() => onChange(icon)} aria-label={`Icon ${icon}`} aria-pressed={normalizeItemIcon(value, "book") === icon} className={cn("grid h-12 w-12 place-items-center rounded-[15px] border-2 border-border bg-accent text-muted-foreground transition-colors hover:bg-muted/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground sm:h-[52px] sm:w-[52px]", normalizeItemIcon(value, "book") === icon && "bg-primary/10 text-primary")}><ItemIcon value={icon} fallback="book" size={24}/></button>)}
  </div>;
}
