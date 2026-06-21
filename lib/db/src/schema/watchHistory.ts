import { pgTable, text, serial, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contentTable } from "./content";
import { episodesTable } from "./episodes";

export const watchHistoryTable = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => contentTable.id, { onDelete: "cascade" }),
  episodeId: integer("episode_id").references(() => episodesTable.id, { onDelete: "set null" }),
  progressSeconds: integer("progress_seconds").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  watchedAt: timestamp("watched_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.contentId)]);

export const insertWatchHistorySchema = createInsertSchema(watchHistoryTable).omit({ id: true });
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type WatchHistory = typeof watchHistoryTable.$inferSelect;
