export interface ReminderRow {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  type: "custom" | "meeting" | "interview" | "medicine" | "call" | "appointment";
  event_link: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  remind_at: string;
  remind_before_minutes: number;
  repeat: "none" | "daily" | "weekly";
  status: "scheduled" | "snoozed" | "completed" | "missed" | "cancelled";
  snoozed_until: string | null;
  requires_completion: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}