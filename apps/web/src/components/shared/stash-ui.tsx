import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Surface({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-[10px] border border-border bg-card", className)} {...props} />;
}

export function SearchField({ label, className, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return <div className={cn("flex min-h-10 min-w-[180px] items-center gap-2 rounded-lg border border-input bg-card px-3 text-muted-foreground focus-within:border-muted-foreground", className)}><Search size={16} aria-hidden="true"/><input {...props} aria-label={label} className="min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-foreground outline-none" /></div>;
}

export function StashEmpty({ icon: Icon, title, description, action, onAction }: { icon: React.ElementType; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="rounded-[14px] border border-dashed border-border bg-card px-5 py-[52px] text-center"><span className="mx-auto mb-3.5 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-primary/10 text-primary"><Icon size={22}/></span><h2 className="text-base font-extrabold">{title}</h2><p className="mb-[18px] mt-1.5 text-[13.5px] text-muted-foreground">{description}</p><Button onClick={onAction} className="h-[38px] rounded-lg font-bold">{action}</Button></div>;
}
