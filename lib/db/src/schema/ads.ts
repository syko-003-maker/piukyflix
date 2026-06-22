import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

/** House pre-roll ads shown before playback for non-VIP users. */
export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("video"), // "video" | "image"
  url: text("url").notNull(),
  title: text("title"),
  durationSeconds: integer("duration_seconds").notNull().default(5), // skip allowed after N seconds
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Ad = typeof adsTable.$inferSelect;
