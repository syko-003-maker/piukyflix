import { pgTable, text, serial, timestamp, integer, boolean, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentTypeEnum = pgEnum("content_type", ["movie", "series"]);

export const contentTable = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  videoUrl: text("video_url"),
  categoryId: integer("category_id"),
  genre: text("genre"),
  releaseYear: integer("release_year"),
  durationMinutes: integer("duration_minutes"),
  maturityRating: text("maturity_rating"),
  cast: text("cast_members"),
  director: text("director"),
  tagline: text("tagline"),
  trailerUrl: text("trailer_url"),
  originalLanguage: text("original_language"),
  country: text("country"),
  tmdbId: integer("tmdb_id"),
  contentType: contentTypeEnum("content_type").notNull().default("movie"),
  isFeatured: boolean("is_featured").notNull().default(false),
  averageRating: numeric("average_rating", { precision: 3, scale: 1 }),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContentSchema = createInsertSchema(contentTable).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contentTable.$inferSelect;
