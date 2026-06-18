import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, contentTable, categoriesTable, watchHistoryTable, commentsTable, invitationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { Resend } from "resend";

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

function buildInviteHtml(email: string, role: string, message: string | undefined, siteUrl: string) {
  const roleLabel: Record<string, string> = { admin: "Administrateur", moderator: "Modérateur", user: "Utilisateur" };
  return `
    <div style="font-family:Inter,sans-serif;background:#0d0f1a;color:#fff;padding:40px;border-radius:12px;max-width:520px;margin:0 auto">
      <h1 style="font-size:28px;font-weight:900;margin:0 0 4px">Piuky<span style="color:#e50914">Flix</span></h1>
      <p style="color:#9ca3af;margin:0 0 32px;font-size:13px">La plateforme de streaming</p>
      <h2 style="font-size:22px;font-weight:700;margin:0 0 12px">Vous êtes invité(e) !</h2>
      <p style="color:#d1d5db;line-height:1.6;margin:0 0 8px">
        Vous avez été invité(e) à rejoindre <strong>PiukyFlix</strong> avec le rôle&nbsp;:
        <span style="background:#e50914;color:#fff;padding:2px 10px;border-radius:4px;font-size:13px;font-weight:700">${roleLabel[role] || role}</span>
      </p>
      ${message ? `<p style="color:#d1d5db;line-height:1.6;background:#1e2235;border-left:3px solid #e50914;padding:12px 16px;border-radius:4px;margin:16px 0">${message}</p>` : ""}
      <a href="${siteUrl}/sign-up"
         style="display:inline-block;margin-top:24px;background:#e50914;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none">
        Créer mon compte
      </a>
      <p style="color:#6b7280;font-size:12px;margin-top:32px">
        Si vous ne souhaitez pas rejoindre PiukyFlix, ignorez cet e-mail.
      </p>
    </div>
  `;
}

router.post("/admin/invite", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { email, role = "user", message } = req.body;
  if (!email) { res.status(400).json({ error: "email requis" }); return; }

  const appUrl = (process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim();
  const siteUrl = appUrl ? `https://${appUrl}` : "https://piukyflix.replit.app";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "PiukyFlix <onboarding@resend.dev>",
    to: email,
    subject: "Vous êtes invité(e) à rejoindre PiukyFlix 🎬",
    html: buildInviteHtml(email, role, message, siteUrl),
  });

  const status = error ? "failed" : "sent";

  const [inv] = await db.insert(invitationsTable).values({
    email, role, message: message || null,
    status, invitedById: admin.id, invitedByEmail: admin.email,
  }).returning();

  if (error) {
    req.log.error({ err: error }, "Resend error");
    res.status(500).json({ error: "Échec de l'envoi de l'e-mail" });
    return;
  }

  res.json({ success: true, id: inv.id });
});

router.get("/admin/invitations", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const rows = await db.select().from(invitationsTable).orderBy(desc(invitationsTable.sentAt)).limit(200);
  res.json(rows.map(r => ({
    id: r.id, email: r.email, role: r.role, message: r.message,
    status: r.status, invitedByEmail: r.invitedByEmail,
    sentAt: r.sentAt.toISOString(),
  })));
});

router.post("/admin/invitations/:id/resend", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const inv = await db.select().from(invitationsTable).where(eq(invitationsTable.id, Number(req.params.id))).limit(1);
  if (!inv[0]) { res.status(404).json({ error: "Not found" }); return; }

  const appUrl = (process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim();
  const siteUrl = appUrl ? `https://${appUrl}` : "https://piukyflix.replit.app";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "PiukyFlix <onboarding@resend.dev>",
    to: inv[0].email,
    subject: "Vous êtes invité(e) à rejoindre PiukyFlix 🎬",
    html: buildInviteHtml(inv[0].email, inv[0].role, inv[0].message ?? undefined, siteUrl),
  });

  const newStatus = error ? "failed" : "sent";

  await db.insert(invitationsTable).values({
    email: inv[0].email, role: inv[0].role,
    message: inv[0].message,
    status: newStatus,
    invitedById: admin.id, invitedByEmail: admin.email,
  });

  if (error) {
    req.log.error({ err: error }, "Resend resend error");
    res.status(500).json({ error: "Échec du renvoi" });
    return;
  }

  res.json({ success: true });
});

export default router;
