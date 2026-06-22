import { Router } from "express";
import { db } from "@workspace/db";
import { adsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getDbUser, requireStaff } from "../middlewares/auth";

const router = Router();

function formatAd(a: any) {
  return {
    id: a.id,
    type: a.type,
    url: a.url,
    title: a.title ?? null,
    durationSeconds: a.durationSeconds,
    enabled: a.enabled,
    createdAt: a.createdAt.toISOString(),
  };
}

// One active pre-roll ad for any logged-in user (random enabled one). Null if none.
router.get("/ads/active", async (req, res) => {
  if (!(await getDbUser(req, res))) return;
  const rows = await db.select().from(adsTable).where(eq(adsTable.enabled, true)).orderBy(sql`random()`).limit(1);
  res.json(rows[0] ? formatAd(rows[0]) : null);
});

router.get("/ads", async (req, res) => {
  if (!(await requireStaff(req, res))) return;
  const rows = await db.select().from(adsTable).orderBy(desc(adsTable.createdAt));
  res.json(rows.map(formatAd));
});

router.post("/ads", async (req, res) => {
  if (!(await requireStaff(req, res))) return;
  const { type, url, title, durationSeconds } = (req.body ?? {}) as any;
  if (typeof url !== "string" || !url) { res.status(400).json({ error: "URL requise" }); return; }
  const d = Number(durationSeconds);
  const [ad] = await db.insert(adsTable).values({
    type: type === "image" ? "image" : "video",
    url,
    title: typeof title === "string" && title ? title : null,
    durationSeconds: Number.isFinite(d) && d >= 0 ? Math.floor(d) : 5,
  }).returning();
  res.status(201).json(formatAd(ad));
});

router.patch("/ads/:id", async (req, res) => {
  if (!(await requireStaff(req, res))) return;
  const { type, url, title, durationSeconds, enabled } = (req.body ?? {}) as any;
  const set: Record<string, unknown> = {};
  if (type === "image" || type === "video") set.type = type;
  if (typeof url === "string" && url) set.url = url;
  if (typeof title === "string") set.title = title || null;
  if (durationSeconds !== undefined) { const d = Number(durationSeconds); if (Number.isFinite(d)) set.durationSeconds = Math.floor(d); }
  if (typeof enabled === "boolean") set.enabled = enabled;
  const [ad] = await db.update(adsTable).set(set).where(eq(adsTable.id, Number(req.params.id))).returning();
  if (!ad) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatAd(ad));
});

router.delete("/ads/:id", async (req, res) => {
  if (!(await requireStaff(req, res))) return;
  await db.delete(adsTable).where(eq(adsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
