import { Router } from "express";
import { db } from "@workspace/db";
import { requestsTable, requestVotesTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { getDbUser, requireStaff } from "../middlewares/auth";

const router = Router();

const STATUSES = ["pending", "approved", "done", "rejected"];

router.get("/requests", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;

  const rows = await db.select().from(requestsTable).orderBy(desc(requestsTable.createdAt));

  const counts = await db
    .select({ requestId: requestVotesTable.requestId, count: sql<number>`count(*)` })
    .from(requestVotesTable)
    .groupBy(requestVotesTable.requestId);
  const countMap: Record<number, number> = {};
  counts.forEach((c) => { countMap[c.requestId] = Number(c.count); });

  const myVotes = await db.select().from(requestVotesTable).where(eq(requestVotesTable.userId, user.id));
  const mySet = new Set(myVotes.map((m) => m.requestId));

  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  const requesters = userIds.length ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const nameMap: Record<string, string> = {};
  requesters.forEach((u) => { nameMap[u.id] = u.username || u.email; });

  res.json(rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    note: r.note,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    requestedBy: r.userId ? (nameMap[r.userId] ?? null) : null,
    votes: countMap[r.id] ?? 0,
    hasVoted: mySet.has(r.id),
    mine: r.userId === user.id,
  })));
});

router.post("/requests", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const { title, type, note } = (req.body ?? {}) as any;
  if (typeof title !== "string" || !title.trim()) { res.status(400).json({ error: "Titre requis" }); return; }
  const t = ["movie", "series", "any"].includes(type) ? type : "any";
  const [r] = await db.insert(requestsTable).values({
    userId: user.id,
    title: title.trim().slice(0, 200),
    type: t,
    note: typeof note === "string" && note ? note.slice(0, 1000) : null,
  }).returning();
  res.status(201).json({ id: r.id });
});

router.post("/requests/:id/vote", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const requestId = Number(req.params.id);
  const existing = await db.select().from(requestVotesTable)
    .where(and(eq(requestVotesTable.requestId, requestId), eq(requestVotesTable.userId, user.id))).limit(1);
  if (existing[0]) {
    await db.delete(requestVotesTable).where(eq(requestVotesTable.id, existing[0].id));
    res.json({ voted: false });
  } else {
    await db.insert(requestVotesTable).values({ requestId, userId: user.id });
    res.json({ voted: true });
  }
});

router.patch("/requests/:id", async (req, res) => {
  if (!(await requireStaff(req, res))) return;
  const { status } = (req.body ?? {}) as any;
  if (!STATUSES.includes(status)) { res.status(400).json({ error: "Statut invalide" }); return; }
  const [r] = await db.update(requestsTable).set({ status }).where(eq(requestsTable.id, Number(req.params.id))).returning();
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

router.delete("/requests/:id", async (req, res) => {
  const user = await getDbUser(req, res);
  if (!user) return;
  const requestId = Number(req.params.id);
  const rows = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  const isStaff = user.role === "admin" || user.role === "moderator";
  if (!isStaff && rows[0].userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(requestsTable).where(eq(requestsTable.id, requestId));
  res.status(204).send();
});

export default router;
