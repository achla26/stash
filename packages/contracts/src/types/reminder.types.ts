import type {
  ReminderType,
  ReminderStatus,
  ReminderRepeat,
} from "../schemas/reminder.schema";

export type { ReminderType, ReminderStatus, ReminderRepeat };

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  note: string | null;
  type: ReminderType;
  eventLink: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  remindAt: string;
  remindBeforeMinutes: number;
  repeat: ReminderRepeat;
  status: ReminderStatus;
  snoozedUntil: string | null;
  requiresCompletion: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}