import { z } from "zod";

export const reminderTypeSchema = z.enum([
  "custom",
  "meeting",
  "interview",
  "medicine",
  "call",
  "appointment",
]);

export const reminderStatusSchema = z.enum([
  "scheduled",
  "snoozed",
  "completed",
  "missed",
  "cancelled",
]);

export const reminderRepeatSchema = z.enum(["none", "daily", "weekly"]);

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  note: z.string().optional().nullable(),
  type: reminderTypeSchema.optional().default("custom"),
  eventLink: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  startAt: z.string().datetime({ message: "Valid date/time required" }),
  endAt: z.string().datetime().optional().nullable(),
  remindBeforeMinutes: z.number().int().min(0).optional().default(10),
  repeat: reminderRepeatSchema.optional().default("none"),
  requiresCompletion: z.boolean().optional().default(false),
});

export const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  note: z.string().optional().nullable(),
  type: reminderTypeSchema.optional(),
  eventLink: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional().nullable(),
  remindBeforeMinutes: z.number().int().min(0).optional(),
  repeat: reminderRepeatSchema.optional(),
  status: reminderStatusSchema.optional(),
  requiresCompletion: z.boolean().optional(),
});

export const snoozeReminderSchema = z.object({
  minutes: z.number().int().min(1).max(1440),
});

export type ReminderType = z.infer<typeof reminderTypeSchema>;
export type ReminderStatus = z.infer<typeof reminderStatusSchema>;
export type ReminderRepeat = z.infer<typeof reminderRepeatSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type SnoozeReminderInput = z.infer<typeof snoozeReminderSchema>;