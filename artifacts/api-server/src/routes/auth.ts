import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

// Comma-separated allowlist of emails auto-promoted to admin on sign-in.
// Configure via the ADMIN_EMAILS env var; falls back to the original owner email.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "seanloulou33@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

router.get("/auth/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user[0].id,
    clerkId: user[0].clerkId,
    email: user[0].email,
    username: user[0].username,
    role: user[0].role,
    avatarUrl: user[0].avatarUrl,
    createdAt: user[0].createdAt.toISOString(),
  });
});

router.post("/auth/sync", async (req, res) => {
  const { userId, sessionClaims } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = (sessionClaims?.email as string) ?? "";
  const username = (sessionClaims?.username as string) ?? null;
  const avatarUrl = (sessionClaims?.image_url as string) ?? null;
  // Treat the email as verified unless the claim is explicitly false. For full
  // assurance, expose `email_verified` in the Clerk JWT template.
  const emailVerified = sessionClaims?.email_verified !== false;

  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);

  const isAdmin = emailVerified && ADMIN_EMAILS.includes(email.toLowerCase());

  if (existing[0]) {
    const updated = await db.update(usersTable)
      .set({ email, username, avatarUrl, ...(isAdmin ? { role: "admin" } : {}) })
      .where(eq(usersTable.clerkId, userId))
      .returning();
    const u = updated[0];
    res.json({ id: u.id, clerkId: u.clerkId, email: u.email, username: u.username, role: u.role, avatarUrl: u.avatarUrl, createdAt: u.createdAt.toISOString() });
    return;
  }

  const newUser = await db.insert(usersTable).values({
    id: randomUUID(),
    clerkId: userId,
    email,
    username,
    avatarUrl,
    role: isAdmin ? "admin" : "user",
  }).returning();
  const u = newUser[0];
  res.json({ id: u.id, clerkId: u.clerkId, email: u.email, username: u.username, role: u.role, avatarUrl: u.avatarUrl, createdAt: u.createdAt.toISOString() });
});

export default router;
