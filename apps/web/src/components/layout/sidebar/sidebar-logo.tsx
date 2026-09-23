import { Infinity } from "lucide-react";

export function SidebarLogo() {
  return (
    <div className="flex items-center gap-2 p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-button">
        <Infinity className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-foreground">Stash</span>
    </div>
  );
}