/**
 * Shared authorization helpers.
 *
 * Each returns the resolved DB user on success, or null after sending the
 * appropriate error response (so callers do `if (!await requireX(req, res)) return;`).
 *
 * Tiers:
 *   - getDbUser    — any authenticated user
 *   - requireStaff — admin OR moderator (content management)
 *   - requireAdmin — admin only (user management, invitations)
 */

import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getDbUser(req: Request, res: Response): Promise<User | null> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);
  if (!rows[0]) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  if (rows[0].status === "banned") {
    res.status(403).json({ error: "Compte suspendu" });
    return null;
  }
  return rows[0];
}

export async function requireStaff(req: Request, res: Response): Promise<User | null> {
  const user = await getDbUser(req, res);
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "moderator") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

export async function requireAdmin(req: Request, res: Response): Promise<User | null> {
  const user = await getDbUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}
