import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, contentTable, categoriesTable, watchHistoryTable, commentsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: any, res: any) {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user[0] || (user[0].role !== "admin" && user[0].role !== "moderator")) {
    res.status(403).json({ error: "Forbidden" }); return null;
  }
  return user[0];
}

router.get("/admin/stats", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const [totalUsers, totalContent, movies, series, totalCategories, totalWatchEvents, totalComments, topContent, recentActivity] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(contentTable),
    db.select({ count: sql<number>`count(*)` }).from(contentTable).where(eq(contentTable.contentType, "movie")),
    db.select({ count: sql<number>`count(*)` }).from(contentTable).where(eq(contentTable.contentType, "series")),
    db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
    db.select({ count: sql<number>`count(*)` }).from(watchHistoryTable),
    db.select({ count: sql<number>`count(*)` }).from(commentsTable),
    db.select().from(contentTable).orderBy(desc(contentTable.viewCount)).limit(5),
    db.select({ history: watchHistoryTable, content: contentTable })
      .from(watchHistoryTable)
      .innerJoin(contentTable, eq(watchHistoryTable.contentId, contentTable.id))
      .orderBy(desc(watchHistoryTable.watchedAt))
      .limit(10),
  ]);

  res.json({
    totalUsers: Number(totalUsers[0].count),
    totalContent: Number(totalContent[0].count),
    totalMovies: Number(movies[0].count),
    totalSeries: Number(series[0].count),
    totalCategories: Number(totalCategories[0].count),
    totalWatchEvents: Number(totalWatchEvents[0].count),
    totalComments: Number(totalComments[0].count),
    topContent: topContent.map(c => ({
      id: c.id, title: c.title, posterUrl: c.posterUrl, contentType: c.contentType,
      viewCount: c.viewCount, isFeatured: c.isFeatured, averageRating: c.averageRating ? Number(c.averageRating) : null,
      createdAt: c.createdAt.toISOString(),
    })),
    recentActivity: recentActivity.map(r => ({
      id: r.history.id, userId: r.history.userId, contentId: r.history.contentId,
      episodeId: r.history.episodeId, progressSeconds: r.history.progressSeconds,
      completed: r.history.completed, watchedAt: r.history.watchedAt.toISOString(),
      content: {
        id: r.content.id, title: r.content.title, posterUrl: r.content.posterUrl,
        contentType: r.content.contentType, viewCount: r.content.viewCount,
        isFeatured: r.content.isFeatured, createdAt: r.content.createdAt.toISOString(),
        averageRating: r.content.averageRating ? Number(r.content.averageRating) : null,
      }
    })),
  });
});

router.get("/admin/users", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({
    id: u.id, clerkId: u.clerkId, email: u.email, username: u.username,
    role: u.role, avatarUrl: u.avatarUrl, createdAt: u.createdAt.toISOString(),
  })));
});

router.patch("/admin/users/:userId/role", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { role } = req.body;
  if (!["user", "admin", "moderator"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
  const updated = await db.update(usersTable).set({ role }).where(eq(usersTable.id, req.params.userId)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  const u = updated[0];
  res.json({ id: u.id, clerkId: u.clerkId, email: u.email, username: u.username, role: u.role, avatarUrl: u.avatarUrl, createdAt: u.createdAt.toISOString() });
});

router.delete("/admin/users/:userId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  await db.delete(usersTable).where(eq(usersTable.id, req.params.userId));
  res.status(204).send();
});

export default router;
