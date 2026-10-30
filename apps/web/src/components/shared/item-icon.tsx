import { Book, BookOpen, BookMarked, Bookmark, Briefcase, FileText, Folder, FolderOpen, Folders, Palette, Library, Gamepad2, FlaskConical, Music, House, Wallet, Globe, Layers, Tag, PanelLeft, File, Zap, ShieldCheck, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { book: Book, "book-open": BookOpen, "book-marked": BookMarked, bookmark: Bookmark, briefcase: Briefcase, note: FileText, folder: Folder, "folder-open": FolderOpen, folders: Folders, palette: Palette, library: Library, game: Gamepad2, science: FlaskConical, music: Music, home: House, wallet: Wallet, globe: Globe, layers: Layers, tag: Tag, panel: PanelLeft, file: File, zap: Zap, shield: ShieldCheck };
// Interpret existing emoji values without changing saved records.
const legacy: Record<string, string> = { "📓": "book", "📕": "book-marked", "📗": "book-open", "📘": "book", "📙": "bookmark", "📔": "book-marked", "📒": "book", "📝": "note", "🗂️": "folders", "💼": "briefcase", "📁": "folder", "🎨": "palette", "📚": "library", "🎮": "game", "🔬": "science", "🎵": "music", "🏠": "home", "💰": "wallet", "🌍": "globe" };
export const NOTEBOOK_ICONS = ["book", "note", "folder", "briefcase", "layers", "tag", "panel", "file", "zap", "shield"] as const;
export const COLLECTION_ICONS = ["folder", "palette", "briefcase", "library", "game", "science", "music", "home", "wallet", "globe"] as const;
export function normalizeItemIcon(value?: string | null, fallback = "folder") { return value && icons[value] ? value : value && legacy[value] ? legacy[value] : fallback; }
export function ItemIcon({ value, fallback = "folder", className, size = 18 }: { value?: string | null; fallback?: string; className?: string; size?: number }) {
  const Icon = icons[normalizeItemIcon(value, fallback)] ?? Folder;
  return <Icon aria-hidden="true" className={className} size={size} />;
}
