import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  contentTable, categoriesTable, usersTable,
  seasonsTable, episodesTable, favoritesTable,
  watchHistoryTable, ratingsTable
} from "@workspace/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { CreateContentBody, UpdateContentBody } from "@workspace/api-zod";
import { requireStaff } from "../middlewares/auth";
import { toInt } from "../lib/utils";

const router = Router();

async function formatContent(c: any, categoryName?: string | null) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    posterUrl: c.posterUrl,
    backdropUrl: c.backdropUrl,
    videoUrl: c.videoUrl,
    categoryId: c.categoryId,
    categoryName: categoryName ?? null,
    genre: c.genre,
    releaseYear: c.releaseYear,
    durationMinutes: c.durationMinutes,
    contentType: c.contentType,
    isFeatured: c.isFeatured,
    maturityRating: c.maturityRating ?? null,
    cast: c.cast ?? null,
    director: c.director ?? null,
    tagline: c.tagline ?? null,
    trailerUrl: c.trailerUrl ?? null,
    originalLanguage: c.originalLanguage ?? null,
    country: c.country ?? null,
    tmdbId: c.tmdbId ?? null,
    isPublished: c.isPublished,
    averageRating: c.averageRating ? Number(c.averageRating) : null,
    viewCount: c.viewCount,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

async function getContentList(items: any[]) {
  const categoryIds = [...new Set(items.map(i => i.categoryId).filter(Boolean))] as number[];
  const categories = categoryIds.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, categoryIds))
    : [];
  const catMap: Record<number, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  return Promise.all(items.map(i => formatContent(i, i.categoryId ? catMap[i.categoryId] : null)));
}

router.get("/content", async (req, res) => {
  const { categoryId, genre, type } = req.query as any;
  const limit = toInt(req.query.limit, 20, 1, 100);
  const offset = toInt(req.query.offset, 0, 0, 1_000_000);

  // Staff can request unpublished drafts too via ?all=true; the public never sees them.
  let includeUnpublished = false;
  if (req.query.all === "true") {
    const { userId } = getAuth(req);
    if (userId) {
      const u = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
      includeUnpublished = u[0]?.role === "admin" || u[0]?.role === "moderator";
    }
  }

  const conditions = [];
  if (categoryId) conditions.push(eq(contentTable.categoryId, Number(categoryId)));
  if (genre) conditions.push(eq(contentTable.genre, genre));
  if (type) conditions.push(eq(contentTable.contentType, type));
  if (!includeUnpublished) conditions.push(eq(contentTable.isPublished, true));

  const items = conditions.length > 0
    ? await db.select().from(contentTable).where(and(...conditions)).orderBy(desc(contentTable.createdAt)).limit(limit).offset(offset)
    : await db.select().from(contentTable).orderBy(desc(contentTable.createdAt)).limit(limit).offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(contentTable).where(conditions.length > 0 ? and(...conditions) : undefined);
  const formatted = await getContentList(items);
  res.json({ items: formatted, total: Number(total[0].count) });
});

router.post("/content", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = CreateContentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { title, description, posterUrl, backdropUrl, videoUrl, categoryId, genre, releaseYear, durationMinutes, contentType, isFeatured, maturityRating, cast, director, tagline, trailerUrl, originalLanguage, country, tmdbId, isPublished } = parsed.data;
  const item = await db.insert(contentTable).values({
    title, description, posterUrl, backdropUrl, videoUrl,
    categoryId: categoryId ? Number(categoryId) : null,
    genre, releaseYear: releaseYear ? Number(releaseYear) : null,
    durationMinutes: durationMinutes ? Number(durationMinutes) : null,
    contentType, isFeatured: isFeatured ?? false,
    maturityRating, cast, director, tagline, trailerUrl, originalLanguage, country,
    tmdbId: tmdbId ? Number(tmdbId) : null,
    isPublished: isPublished ?? true,
  }).returning();
  const formatted = await formatContent(item[0]);
  res.status(201).json(formatted);
});

router.get("/content/featured", async (req, res) => {
  const items = await db.select().from(contentTable).where(and(eq(contentTable.isFeatured, true), eq(contentTable.isPublished, true))).orderBy(desc(contentTable.createdAt)).limit(10);
  const formatted = await getContentList(items);
  res.json(formatted);
});

router.get("/content/latest", async (req, res) => {
  const limit = toInt(req.query.limit, 12, 1, 100);
  const items = await db.select().from(contentTable).where(eq(contentTable.isPublished, true)).orderBy(desc(contentTable.createdAt)).limit(limit);
  const formatted = await getContentList(items);
  res.json(formatted);
});

router.get("/content/popular", async (req, res) => {
  const limit = toInt(req.query.limit, 12, 1, 100);
  const items = await db.select().from(contentTable).where(eq(contentTable.isPublished, true)).orderBy(desc(contentTable.viewCount), desc(contentTable.averageRating)).limit(limit);
  const formatted = await getContentList(items);
  res.json(formatted);
});

router.get("/content/:id", async (req, res) => {
  const id = Number(req.params.id);
  const item = await db.select().from(contentTable).where(eq(contentTable.id, id)).limit(1);
  if (!item[0]) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(contentTable).set({ viewCount: sql`${contentTable.viewCount} + 1` }).where(eq(contentTable.id, id));

  const seasons = await db.select().from(seasonsTable).where(eq(seasonsTable.contentId, id)).orderBy(seasonsTable.seasonNumber);
  const seasonsWithEpisodes = await Promise.all(seasons.map(async (s) => {
    const episodes = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, s.id)).orderBy(episodesTable.episodeNumber);
    return {
      id: s.id, contentId: s.contentId, seasonNumber: s.seasonNumber,
      title: s.title, description: s.description,
      createdAt: s.createdAt.toISOString(),
      episodes: episodes.map(e => ({
        id: e.id, seasonId: e.seasonId, episodeNumber: e.episodeNumber,
        title: e.title, description: e.description, videoUrl: e.videoUrl,
        thumbnailUrl: e.thumbnailUrl, durationMinutes: e.durationMinutes,
        isPublished: e.isPublished,
        createdAt: e.createdAt.toISOString(),
      }))
    };
  }));

  const { userId } = getAuth(req);
  let isFavorite = false;
  let userRating = null;
  let watchProgress = null;

  if (userId) {
    const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
    if (user[0]) {
      const fav = await db.select().from(favoritesTable).where(and(eq(favoritesTable.userId, user[0].id), eq(favoritesTable.contentId, id))).limit(1);
      isFavorite = !!fav[0];
      const rating = await db.select().from(ratingsTable).where(and(eq(ratingsTable.userId, user[0].id), eq(ratingsTable.contentId, id))).limit(1);
      userRating = rating[0]?.score ?? null;
      const progress = await db.select().from(watchHistoryTable).where(and(eq(watchHistoryTable.userId, user[0].id), eq(watchHistoryTable.contentId, id))).limit(1);
      watchProgress = progress[0]?.progressSeconds ?? null;
    }
  }

  let categoryName = null;
  if (item[0].categoryId) {
    const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, item[0].categoryId)).limit(1);
    categoryName = cat[0]?.name ?? null;
  }

  const formatted = await formatContent(item[0], categoryName);
  res.json({ ...formatted, seasons: seasonsWithEpisodes, isFavorite, userRating, watchProgress });
});

router.patch("/content/:id", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = UpdateContentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { title, description, posterUrl, backdropUrl, videoUrl, categoryId, genre, releaseYear, durationMinutes, contentType, isFeatured, maturityRating, cast, director, tagline, trailerUrl, originalLanguage, country, tmdbId, isPublished } = parsed.data;
  const item = await db.update(contentTable).set({
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(posterUrl !== undefined && { posterUrl }),
    ...(backdropUrl !== undefined && { backdropUrl }),
    ...(videoUrl !== undefined && { videoUrl }),
    ...(categoryId !== undefined && { categoryId: categoryId ? Number(categoryId) : null }),
    ...(genre !== undefined && { genre }),
    ...(releaseYear !== undefined && { releaseYear: releaseYear ? Number(releaseYear) : null }),
    ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? Number(durationMinutes) : null }),
    ...(contentType && { contentType }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(maturityRating !== undefined && { maturityRating }),
    ...(cast !== undefined && { cast }),
    ...(director !== undefined && { director }),
    ...(tagline !== undefined && { tagline }),
    ...(trailerUrl !== undefined && { trailerUrl }),
    ...(originalLanguage !== undefined && { originalLanguage }),
    ...(country !== undefined && { country }),
    ...(tmdbId !== undefined && { tmdbId: tmdbId ? Number(tmdbId) : null }),
    ...(isPublished !== undefined && { isPublished }),
  }).where(eq(contentTable.id, Number(req.params.id))).returning();
  if (!item[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatContent(item[0]));
});

router.delete("/content/:id", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  await db.delete(contentTable).where(eq(contentTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
