import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** User-submitted requests for films/series to add to the catalog. */
export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("any"), // movie | series | any
  note: text("note"),
  status: text("status").notNull().default("pending"), // pending | approved | done | rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One upvote per user per request. */
export const requestVotesTable = pgTable("request_votes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requestsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContentRequest = typeof requestsTable.$inferSelect;
