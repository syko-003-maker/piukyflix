import { Router } from "express";
import { db } from "@workspace/db";
import { contentTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res) => {
  const { q, type } = req.query as any;
  if (!q) { res.json([]); return; }
  const conditions = [
    or(ilike(contentTable.title, `%${q}%`), ilike(contentTable.description, `%${q}%`))!
  ];
  if (type) conditions.push(eq(contentTable.contentType, type));
  const results = await db.select().from(contentTable).where(and(...conditions)).limit(20);
  res.json(results.map(c => ({
    id: c.id, title: c.title, description: c.description, posterUrl: c.posterUrl,
    backdropUrl: c.backdropUrl, videoUrl: c.videoUrl, categoryId: c.categoryId,
    categoryName: null, genre: c.genre, releaseYear: c.releaseYear,
    durationMinutes: c.durationMinutes, contentType: c.contentType,
    isFeatured: c.isFeatured, averageRating: c.averageRating ? Number(c.averageRating) : null,
    viewCount: c.viewCount, createdAt: c.createdAt.toISOString(),
  })));
});

export default router;
