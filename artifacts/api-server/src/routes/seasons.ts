import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { seasonsTable, episodesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return false; }
  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user[0] || (user[0].role !== "admin" && user[0].role !== "moderator")) {
    res.status(403).json({ error: "Forbidden" }); return false;
  }
  return true;
}

function formatSeason(s: any) {
  return { id: s.id, contentId: s.contentId, seasonNumber: s.seasonNumber, title: s.title, description: s.description, createdAt: s.createdAt.toISOString() };
}

function formatEpisode(e: any) {
  return { id: e.id, seasonId: e.seasonId, episodeNumber: e.episodeNumber, title: e.title, description: e.description, videoUrl: e.videoUrl, thumbnailUrl: e.thumbnailUrl, durationMinutes: e.durationMinutes, createdAt: e.createdAt.toISOString() };
}

router.get("/content/:contentId/seasons", async (req, res) => {
  const seasons = await db.select().from(seasonsTable).where(eq(seasonsTable.contentId, Number(req.params.contentId))).orderBy(seasonsTable.seasonNumber);
  res.json(seasons.map(formatSeason));
});

router.post("/content/:contentId/seasons", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { seasonNumber, title, description } = req.body;
  const s = await db.insert(seasonsTable).values({ contentId: Number(req.params.contentId), seasonNumber, title, description }).returning();
  res.status(201).json(formatSeason(s[0]));
});

router.patch("/seasons/:seasonId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { seasonNumber, title, description } = req.body;
  const s = await db.update(seasonsTable).set({ seasonNumber, title, description }).where(eq(seasonsTable.id, Number(req.params.seasonId))).returning();
  if (!s[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatSeason(s[0]));
});

router.delete("/seasons/:seasonId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  await db.delete(episodesTable).where(eq(episodesTable.seasonId, Number(req.params.seasonId)));
  await db.delete(seasonsTable).where(eq(seasonsTable.id, Number(req.params.seasonId)));
  res.status(204).send();
});

router.get("/seasons/:seasonId/episodes", async (req, res) => {
  const episodes = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, Number(req.params.seasonId))).orderBy(episodesTable.episodeNumber);
  res.json(episodes.map(formatEpisode));
});

router.post("/seasons/:seasonId/episodes", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes } = req.body;
  const e = await db.insert(episodesTable).values({ seasonId: Number(req.params.seasonId), episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes: durationMinutes ? Number(durationMinutes) : null }).returning();
  res.status(201).json(formatEpisode(e[0]));
});

router.patch("/episodes/:episodeId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes } = req.body;
  const e = await db.update(episodesTable).set({ episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes: durationMinutes ? Number(durationMinutes) : null }).where(eq(episodesTable.id, Number(req.params.episodeId))).returning();
  if (!e[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatEpisode(e[0]));
});

router.delete("/episodes/:episodeId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  await db.delete(episodesTable).where(eq(episodesTable.id, Number(req.params.episodeId)));
  res.status(204).send();
});

export default router;
