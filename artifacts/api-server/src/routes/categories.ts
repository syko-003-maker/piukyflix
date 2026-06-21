import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCategoryBody, UpdateCategoryBody } from "@workspace/api-zod";
import { requireStaff } from "../middlewares/auth";

const router = Router();

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return { id: c.id, name: c.name, description: c.description, createdAt: c.createdAt.toISOString() };
}

router.get("/categories", async (req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(cats.map(formatCategory));
});

router.post("/categories", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { name, description } = parsed.data;
  const cat = await db.insert(categoriesTable).values({ name, description }).returning();
  res.status(201).json(formatCategory(cat[0]));
});

router.get("/categories/:id", async (req, res) => {
  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id))).limit(1);
  if (!cat[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCategory(cat[0]));
});

router.patch("/categories/:id", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", details: parsed.error.issues }); return; }
  const { name, description } = parsed.data;
  const cat = await db.update(categoriesTable).set({ name, description }).where(eq(categoriesTable.id, Number(req.params.id))).returning();
  if (!cat[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCategory(cat[0]));
});

router.delete("/categories/:id", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  await db.delete(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
