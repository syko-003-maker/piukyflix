import { Router } from "express";
import { db } from "@workspace/db";
import { seasonsTable, episodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSeasonBody, UpdateSeasonBody, CreateEpisodeBody, UpdateEpisodeBody } from "@workspace/api-zod";
import { requireStaff } from "../middlewares/auth";

const router = Router();

function formatSeason(s: any) {
  return { id: s.id, contentId: s.contentId, seasonNumber: s.seasonNumber, title: s.title, description: s.description, createdAt: s.createdAt.toISOString() };
}

function formatEpisode(e: any) {
  return { id: e.id, seasonId: e.seasonId, episodeNumber: e.episodeNumber, title: e.title, description: e.description, videoUrl: e.videoUrl, thumbnailUrl: e.thumbnailUrl, durationMinutes: e.durationMinutes, isPublished: e.isPublished, createdAt: e.createdAt.toISOString() };
}

router.get("/content/:contentId/seasons", async (req, res) => {
  const seasons = await db.select().from(seasonsTable).where(eq(seasonsTable.contentId, Number(req.params.contentId))).orderBy(seasonsTable.seasonNumber);
  res.json(seasons.map(formatSeason));
});

router.post("/content/:contentId/seasons", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = CreateSeasonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { seasonNumber, title, description } = parsed.data;
  const s = await db.insert(seasonsTable).values({ contentId: Number(req.params.contentId), seasonNumber, title, description }).returning();
  res.status(201).json(formatSeason(s[0]));
});

router.patch("/seasons/:seasonId", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = UpdateSeasonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { seasonNumber, title, description } = parsed.data;
  const s = await db.update(seasonsTable).set({ seasonNumber, title, description }).where(eq(seasonsTable.id, Number(req.params.seasonId))).returning();
  if (!s[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatSeason(s[0]));
});

router.delete("/seasons/:seasonId", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  await db.delete(episodesTable).where(eq(episodesTable.seasonId, Number(req.params.seasonId)));
  await db.delete(seasonsTable).where(eq(seasonsTable.id, Number(req.params.seasonId)));
  res.status(204).send();
});

router.get("/seasons/:seasonId/episodes", async (req, res) => {
  const episodes = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, Number(req.params.seasonId))).orderBy(episodesTable.episodeNumber);
  res.json(episodes.map(formatEpisode));
});

router.post("/seasons/:seasonId/episodes", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = CreateEpisodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes, isPublished } = parsed.data;
  const e = await db.insert(episodesTable).values({ seasonId: Number(req.params.seasonId), episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes: durationMinutes ? Number(durationMinutes) : null, isPublished: isPublished ?? true }).returning();
  res.status(201).json(formatEpisode(e[0]));
});

router.patch("/episodes/:episodeId", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = UpdateEpisodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { episodeNumber, title, description, videoUrl, thumbnailUrl, durationMinutes, isPublished } = parsed.data;
  const e = await db.update(episodesTable).set({
    ...(episodeNumber !== undefined && { episodeNumber }),
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(videoUrl !== undefined && { videoUrl }),
    ...(thumbnailUrl !== undefined && { thumbnailUrl }),
    ...(durationMinutes !== undefined && { durationMinutes: durationMinutes ? Number(durationMinutes) : null }),
    ...(isPublished !== undefined && { isPublished }),
  }).where(eq(episodesTable.id, Number(req.params.episodeId))).returning();
  if (!e[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatEpisode(e[0]));
});

router.delete("/episodes/:episodeId", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  await db.delete(episodesTable).where(eq(episodesTable.id, Number(req.params.episodeId)));
  res.status(204).send();
});

export default router;
