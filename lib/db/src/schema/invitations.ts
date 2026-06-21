import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const invitationStatusEnum = pgEnum("invitation_status", ["sent", "failed"]);

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  message: text("message"),
  status: invitationStatusEnum("status").notNull().default("sent"),
  invitedById: text("invited_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  invitedByEmail: text("invited_by_email"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Invitation = typeof invitationsTable.$inferSelect;
