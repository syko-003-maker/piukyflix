import { useGetAdminStats } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatCard, Reveal } from "@/components/admin/admin-ui";
import { motion } from "framer-motion";
import { Users, Film, Tv, FolderTree, PlayCircle, MessageSquare, TrendingUp, Activity, Percent, UserCheck, Clock, Heart, Star } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";

const PIE_COLORS = ["hsl(357 92% 47%)", "#6366f1"];
const tooltipStyle = {
  background: "hsl(222 47% 11%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
} as const;

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  const typeData = stats
    ? [
        { name: "Films", value: stats.totalMovies },
        { name: "Séries", value: stats.totalSeries },
      ]
    : [];
  const topData = stats
    ? stats.topContent.slice(0, 5).map((c) => ({ name: c.title, views: c.viewCount }))
    : [];
  const signupData = stats?.signupsByDay?.map((s) => ({ day: s.day.slice(5), count: s.count })) ?? [];
  const ratingData = [1, 2, 3, 4, 5].map((score) => ({
    name: `${score}★`,
    count: stats?.ratingsDistribution?.find((r) => r.score === score)?.count ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Vue d'ensemble</h1>
            <p className="mt-1 text-muted-foreground">Statistiques de la plateforme et activité récente</p>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-secondary/40" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Utilisateurs" value={stats.totalUsers} accent="blue" delay={0} icon={<Users className="h-6 w-6" />} />
              <StatCard title="Films" value={stats.totalMovies} accent="red" delay={0.05} icon={<Film className="h-6 w-6" />} />
              <StatCard title="Séries" value={stats.totalSeries} accent="green" delay={0.1} icon={<Tv className="h-6 w-6" />} />
              <StatCard title="Catégories" value={stats.totalCategories} accent="yellow" delay={0.15} icon={<FolderTree className="h-6 w-6" />} />
              <StatCard title="Visionnages" value={stats.totalWatchEvents} accent="purple" delay={0.2} icon={<PlayCircle className="h-6 w-6" />} />
              <StatCard title="Commentaires" value={stats.totalComments} accent="pink" delay={0.25} icon={<MessageSquare className="h-6 w-6" />} />
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard title="Taux de complétion (%)" value={stats.completionRate} accent="green" delay={0} icon={<Percent className="h-6 w-6" />} />
              <StatCard title="Actifs (7 jours)" value={stats.activeUsers7d} accent="blue" delay={0.05} icon={<UserCheck className="h-6 w-6" />} />
              <StatCard title="Heures visionnées" value={stats.totalHoursWatched} accent="purple" delay={0.1} icon={<Clock className="h-6 w-6" />} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Reveal delay={0.1} className="lg:col-span-2">
                <div className="h-full rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-4 text-lg font-bold text-white">Répartition du contenu</h2>
                  <div className="relative h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4} stroke="none">
                          {typeData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{stats.totalContent}</span>
                      <span className="text-xs text-muted-foreground">contenus</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-6 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[0] }} />
                      Films ({stats.totalMovies})
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[1] }} />
                      Séries ({stats.totalSeries})
                    </span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15} className="lg:col-span-3">
                <div className="h-full rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <TrendingUp className="h-5 w-5 text-primary" /> Top contenus par vues
                  </h2>
                  <div className="h-56">
                    {topData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(357 92% 55%)" />
                              <stop offset="100%" stopColor="hsl(357 92% 35%)" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tickFormatter={(v: string) => (v.length > 10 ? v.slice(0, 10) + "…" : v)}
                          />
                          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                          <Bar dataKey="views" name="Vues" radius={[6, 6, 0, 0]} fill="url(#barFill)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">Aucune donnée</div>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Inscriptions + notes */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Reveal delay={0.1}>
                <div className="h-full rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <TrendingUp className="h-5 w-5 text-primary" /> Inscriptions (14 jours)
                  </h2>
                  <div className="h-56">
                    {signupData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={signupData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(265 89% 66%)" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="hsl(265 89% 66%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                          <Area type="monotone" dataKey="count" name="Inscriptions" stroke="hsl(265 89% 66%)" strokeWidth={2} fill="url(#signupFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">Aucune inscription récente</div>
                    )}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="h-full rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <Star className="h-5 w-5 text-yellow-400" /> Répartition des notes
                  </h2>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Bar dataKey="count" name="Notes" radius={[6, 6, 0, 0]} fill="hsl(48 96% 53%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Reveal delay={0.1}>
                <div className="rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-6 text-lg font-bold text-white">Contenu le plus vu</h2>
                  <div className="space-y-4">
                    {stats.topContent.map((content, index) => {
                      const max = stats.topContent[0]?.viewCount || 1;
                      const pct = Math.max(4, Math.round((content.viewCount / max) * 100));
                      return (
                        <motion.div
                          key={content.id}
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.06 }}
                          className="flex items-center gap-4"
                        >
                          <div className="w-6 text-xl font-bold text-muted-foreground">{index + 1}</div>
                          <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-secondary">
                            {content.posterUrl && <img src={content.posterUrl} alt={content.title} className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-bold text-white">{content.title}</h4>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.06 }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">{content.viewCount.toLocaleString("fr-FR")}</div>
                            <div className="text-xs text-muted-foreground">vues</div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {stats.topContent.length === 0 && <p className="py-4 text-center text-muted-foreground">Aucune donnée disponible</p>}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                    <Activity className="h-5 w-5 text-primary" /> Activité récente
                  </h2>
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, i) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/15">
                          <PlayCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-gray-300">
                            <span className="font-mono text-muted-foreground">{activity.userId.slice(0, 8)}…</span> a regardé{" "}
                            <span className="font-bold text-white">{activity.content?.title || "Inconnu"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(activity.watchedAt).toLocaleString("fr-FR")}</p>
                        </div>
                      </motion.div>
                    ))}
                    {stats.recentActivity.length === 0 && <p className="py-4 text-center text-muted-foreground">Aucune activité récente</p>}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Genres + favoris */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Reveal delay={0.1}>
                <div className="rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                    <TrendingUp className="h-5 w-5 text-primary" /> Performance par genre
                  </h2>
                  <div className="space-y-3">
                    {stats.genrePerformance.map((g, i) => {
                      const max = stats.genrePerformance[0]?.views || 1;
                      const pct = Math.max(4, Math.round((g.views / max) * 100));
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-28 truncate text-sm text-white">{g.genre || "—"}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-20 text-right text-xs text-muted-foreground">{g.views.toLocaleString("fr-FR")} vues</span>
                        </div>
                      );
                    })}
                    {stats.genrePerformance.length === 0 && <p className="py-4 text-center text-muted-foreground">Aucune donnée</p>}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="rounded-2xl border border-white/10 bg-card p-6">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                    <Heart className="h-5 w-5 text-pink-400" /> Les plus ajoutés en favoris
                  </h2>
                  <div className="space-y-4">
                    {stats.mostFavorited.map((c, index) => (
                      <div key={c.id} className="flex items-center gap-4">
                        <div className="w-6 text-xl font-bold text-muted-foreground">{index + 1}</div>
                        <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-secondary">
                          {c.posterUrl && <img src={c.posterUrl} alt={c.title} className="h-full w-full object-cover" />}
                        </div>
                        <h4 className="min-w-0 flex-1 truncate font-bold text-white">{c.title}</h4>
                        <div className="flex items-center gap-1 text-pink-400">
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="font-bold">{c.favorites}</span>
                        </div>
                      </div>
                    ))}
                    {stats.mostFavorited.length === 0 && <p className="py-4 text-center text-muted-foreground">Aucun favori</p>}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Répartition des rôles */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard title="Utilisateurs" value={stats.usersByRole.user} accent="blue" delay={0} icon={<Users className="h-6 w-6" />} />
              <StatCard title="Modérateurs" value={stats.usersByRole.moderator} accent="yellow" delay={0.05} icon={<UserCheck className="h-6 w-6" />} />
              <StatCard title="Admins" value={stats.usersByRole.admin} accent="red" delay={0.1} icon={<Users className="h-6 w-6" />} />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
