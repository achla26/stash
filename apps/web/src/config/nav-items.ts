import {
  LayoutGrid,
  FileText,
  Link2,
  BookOpen,
  NotebookPen,
  Settings,
  SpellCheck,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/words", label: "Words", icon: SpellCheck },
  { href: "/notebooks", label: "Notebooks", icon: BookOpen },
  { href: "/pad", label: "Pads", icon: NotebookPen },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
