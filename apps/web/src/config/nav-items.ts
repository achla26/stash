import {
  LayoutGrid,
  FileText,
  Link2,
  BookOpen,
  NotebookPen,
  Settings,
  SpellCheck,
  Sparkles,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/notebooks", label: "Notebooks", icon: BookOpen },
  { href: "/words", label: "Words", icon: SpellCheck },
  { href: "/pad", label: "Pads", icon: NotebookPen },
  { href: "/chat", label: "AI Chat", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
