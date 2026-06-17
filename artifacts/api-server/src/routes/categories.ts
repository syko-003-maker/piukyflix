import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { categoriesTable, usersTable } from "@workspace/db";
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

function formatCategory(c: typeof categoriesTable.$inferSelect) {
  return { id: c.id, name: c.name, description: c.description, createdAt: c.createdAt.toISOString() };
}

router.get("/categories", async (req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(cats.map(formatCategory));
});

router.post("/categories", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const cat = await db.insert(categoriesTable).values({ name, description }).returning();
  res.status(201).json(formatCategory(cat[0]));
});

router.get("/categories/:id", async (req, res) => {
  const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id))).limit(1);
  if (!cat[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCategory(cat[0]));
});

router.patch("/categories/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { name, description } = req.body;
  const cat = await db.update(categoriesTable).set({ name, description }).where(eq(categoriesTable.id, Number(req.params.id))).returning();
  if (!cat[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatCategory(cat[0]));
});

router.delete("/categories/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  await db.delete(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
