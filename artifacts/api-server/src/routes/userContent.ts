import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, contentTable, favoritesTable,
  watchHistoryTable, ratingsTable, commentsTable
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { UpdateWatchProgressBody, RateContentBody, AddCommentBody } from "@workspace/api-zod";
import { getDbUser } from "../middlewares/auth";

const router = Router();

async function formatContentItem(c: any) {
  return {
    id: c.id, title: c.title, description: c.description, posterUrl: c.posterUrl,
    backdropUrl: c.backdropUrl, videoUrl: c.videoUrl, categoryId: c.categoryId,
    categoryName: null, genre: c.genre, releaseYear: c.releaseYear,
    durationMinutes: c.durationMinutes, contentType: c.contentType,
    isFeatured: c.isFeatured, averageRating: c.averageRating ? Number(c.averageRating) : null,
    viewCount: c.viewCount, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

// FAVORITES
router.get("/favorites", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const favs = await db.select({ content: contentTable }).from(favoritesTable)
    .innerJoin(contentTable, eq(favoritesTable.contentId, contentTable.id))
    .where(eq(favoritesTable.userId, user.id))
    .orderBy(desc(favoritesTable.createdAt));
  const formatted = await Promise.all(favs.map(f => formatContentItem(f.content)));
  res.json(formatted);
});

router.post("/favorites/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const contentId = Number(req.params.contentId);
  await db.insert(favoritesTable).values({ userId: user.id, contentId }).onConflictDoNothing();
  res.status(201).json({ success: true });
});

router.delete("/favorites/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, user.id), eq(favoritesTable.contentId, Number(req.params.contentId))));
  res.status(204).send();
});

// WATCH HISTORY
router.get("/watch-history", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const history = await db.select({ history: watchHistoryTable, content: contentTable })
    .from(watchHistoryTable)
    .innerJoin(contentTable, eq(watchHistoryTable.contentId, contentTable.id))
    .where(eq(watchHistoryTable.userId, user.id))
    .orderBy(desc(watchHistoryTable.watchedAt));
  const formatted = history.map(h => ({
    id: h.history.id, userId: h.history.userId, contentId: h.history.contentId,
    episodeId: h.history.episodeId, progressSeconds: h.history.progressSeconds,
    completed: h.history.completed, watchedAt: h.history.watchedAt.toISOString(),
    content: {
      id: h.content.id, title: h.content.title, posterUrl: h.content.posterUrl,
      backdropUrl: h.content.backdropUrl, contentType: h.content.contentType,
      durationMinutes: h.content.durationMinutes, viewCount: h.content.viewCount,
      isFeatured: h.content.isFeatured, createdAt: h.content.createdAt.toISOString(),
      averageRating: h.content.averageRating ? Number(h.content.averageRating) : null,
    }
  }));
  res.json(formatted);
});

router.post("/watch-history/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const contentId = Number(req.params.contentId);
  const parsed = UpdateWatchProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { progressSeconds, episodeId, completed } = parsed.data;

  const entry = await db.insert(watchHistoryTable).values({
    userId: user.id, contentId, episodeId: episodeId ? Number(episodeId) : null,
    progressSeconds: Number(progressSeconds), completed: completed ?? false,
    watchedAt: new Date(),
  }).onConflictDoUpdate({
    target: [watchHistoryTable.userId, watchHistoryTable.contentId],
    set: { progressSeconds: Number(progressSeconds), episodeId: episodeId ? Number(episodeId) : null, completed: completed ?? false, watchedAt: new Date() }
  }).returning();

  res.json({
    id: entry[0].id, userId: entry[0].userId, contentId: entry[0].contentId,
    episodeId: entry[0].episodeId, progressSeconds: entry[0].progressSeconds,
    completed: entry[0].completed, watchedAt: entry[0].watchedAt.toISOString(),
  });
});

router.get("/watch-history/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const entry = await db.select().from(watchHistoryTable).where(and(eq(watchHistoryTable.userId, user.id), eq(watchHistoryTable.contentId, Number(req.params.contentId)))).limit(1);
  if (!entry[0]) {
    res.json({ id: 0, userId: user.id, contentId: Number(req.params.contentId), episodeId: null, progressSeconds: 0, completed: false, watchedAt: new Date().toISOString() });
    return;
  }
  res.json({ id: entry[0].id, userId: entry[0].userId, contentId: entry[0].contentId, episodeId: entry[0].episodeId, progressSeconds: entry[0].progressSeconds, completed: entry[0].completed, watchedAt: entry[0].watchedAt.toISOString() });
});

// RATINGS
router.post("/ratings/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const contentId = Number(req.params.contentId);
  const parsed = RateContentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const score = parsed.data.score;
  if (!Number.isInteger(score) || score < 1 || score > 5) { res.status(400).json({ error: "La note doit être un entier entre 1 et 5" }); return; }

  const rating = await db.insert(ratingsTable).values({ userId: user.id, contentId, score })
    .onConflictDoUpdate({
      target: [ratingsTable.userId, ratingsTable.contentId],
      set: { score }
    }).returning();

  // Recalculate average
  const avg = await db.select({ avg: sql<number>`avg(score)` }).from(ratingsTable).where(eq(ratingsTable.contentId, contentId));
  await db.update(contentTable).set({ averageRating: String(avg[0].avg?.toFixed(1) ?? "0") }).where(eq(contentTable.id, contentId));

  res.json({ id: rating[0].id, userId: rating[0].userId, contentId: rating[0].contentId, score: rating[0].score, createdAt: rating[0].createdAt.toISOString() });
});

router.get("/ratings/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const rating = await db.select().from(ratingsTable).where(and(eq(ratingsTable.userId, user.id), eq(ratingsTable.contentId, Number(req.params.contentId)))).limit(1);
  if (!rating[0]) {
    res.json({ id: 0, userId: user.id, contentId: Number(req.params.contentId), score: 0, createdAt: new Date().toISOString() });
    return;
  }
  res.json({ id: rating[0].id, userId: rating[0].userId, contentId: rating[0].contentId, score: rating[0].score, createdAt: rating[0].createdAt.toISOString() });
});

// COMMENTS
router.get("/comments/:contentId", async (req, res) => {
  const comments = await db.select({ comment: commentsTable, user: usersTable })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.contentId, Number(req.params.contentId)))
    .orderBy(desc(commentsTable.createdAt));
  res.json(comments.map(c => ({
    id: c.comment.id, userId: c.comment.userId, contentId: c.comment.contentId,
    text: c.comment.text, username: c.user?.username ?? c.user?.email ?? null,
    avatarUrl: c.user?.avatarUrl ?? null, createdAt: c.comment.createdAt.toISOString(),
  })));
});

router.post("/comments/:contentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const parsed = AddCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const text = parsed.data.text.trim();
  if (!text) { res.status(400).json({ error: "Le commentaire ne peut pas être vide" }); return; }
  const comment = await db.insert(commentsTable).values({ userId: user.id, contentId: Number(req.params.contentId), text }).returning();
  res.status(201).json({ id: comment[0].id, userId: comment[0].userId, contentId: comment[0].contentId, text: comment[0].text, username: user.username ?? user.email, avatarUrl: user.avatarUrl, createdAt: comment[0].createdAt.toISOString() });
});

router.delete("/comments/item/:commentId", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  await db.delete(commentsTable).where(and(eq(commentsTable.id, Number(req.params.commentId)), eq(commentsTable.userId, user.id)));
  res.status(204).send();
});

export default router;
