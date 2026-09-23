export interface DashboardStats {
  totalNotes: number;
  totalLinks: number;
  totalNotebooks: number;
  totalPads: number;
}

export interface RecentItem {
  id: string;
  type: "note" | "link" | "notebook" | "page";
  title: string;
  description: string | null;
  updatedAt: string;
  icon?: string;
  color?: string;
}


export interface DashboardData {
  stats: DashboardStats;
  recentItems: RecentItem[];
}