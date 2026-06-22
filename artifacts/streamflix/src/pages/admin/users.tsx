import { useState } from "react";
import { useListUsers, useDeleteUser, useUpdateUserRole, useGetMe } from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Users, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/admin/admin-ui";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = useListUsers();
  const { data: me } = useGetMe();
  const deleteUser = useDeleteUser();
  const updateRole = useUpdateUserRole();

  const [search, setSearch] = useState("");
  const filtered = (users ?? []).filter((u: any) => {
    const query = search.trim().toLowerCase();
    return !query || (u.username || "").toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.role.toLowerCase().includes(query);
  });

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/users/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    refetch();
  };

  const statusBadge = (s?: string) => {
    if (s === "banned") return "bg-destructive/20 text-destructive border border-destructive/30";
    if (s === "suspended") return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-green-500/20 text-green-400 border border-green-500/30";
  };
  const statusLabel = (s?: string) => (s === "banned" ? "Banni" : s === "suspended" ? "Suspendu" : "Actif");

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      deleteUser.mutate({ userId: id }, {
        onSuccess: () => refetch()
      });
    }
  };

  const handleToggleRole = (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRole.mutate({ userId: id, data: { role: newRole as any } }, {
      onSuccess: () => refetch()
    });
  };

  const roleBadgeClass = (role: string) => {
    if (role === 'admin') return 'bg-primary/20 text-primary border border-primary/30';
    if (role === 'moderator') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    return 'bg-secondary text-muted-foreground border border-white/10';
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'moderator') return 'Modérateur';
    return 'Utilisateur';
  };

  const avatarRingClass = (role: string) => {
    if (role === 'admin') return 'ring-primary/60';
    if (role === 'moderator') return 'ring-blue-500/60';
    return 'ring-white/20';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-card p-3 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gérer les utilisateurs</h1>
              <p className="text-muted-foreground mt-1">Consultez et gérez les comptes et permissions</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mb-4 relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, e-mail, rôle)…"
              className="h-10 w-full rounded-lg border border-white/10 bg-secondary/50 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/50" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden transition-colors duration-300 hover:border-white/20">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Utilisateur</TableHead>
                  <TableHead className="text-muted-foreground">E-mail</TableHead>
                  <TableHead className="text-muted-foreground">Rôle</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-muted-foreground">Inscrit le</TableHead>
                  <TableHead className="text-muted-foreground">Dernière activité</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filtered.map((u: any, i: number) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -2 }}
                        className="border-b border-white/10 transition-colors duration-200 hover:bg-secondary/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-9 w-9 ring-2 ring-offset-2 ring-offset-card ${avatarRingClass(u.role)}`}>
                              <AvatarImage src={u.avatarUrl || ""} />
                              <AvatarFallback>{u.username?.charAt(0) || u.email.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-white">{u.username || "Inconnu"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadgeClass(u.role)}`}>
                            {roleLabel(u.role)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(u.status)}`}>
                            {statusLabel(u.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-muted-foreground">{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Select
                              value={u.role}
                              onValueChange={(v) =>
                                updateRole.mutate(
                                  { userId: u.id, data: { role: v as any } },
                                  { onSuccess: () => refetch() }
                                )
                              }
                              disabled={u.id === me?.id || updateRole.isPending}
                            >
                              <SelectTrigger className="h-9 w-[150px] bg-secondary border-white/10 text-white">
                                <SelectValue placeholder="Rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="moderator">Modérateur</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={u.status || "active"}
                              onValueChange={(v) => setStatus(u.id, v)}
                              disabled={u.id === me?.id}
                            >
                              <SelectTrigger className="h-9 w-[130px] bg-secondary border-white/10 text-white">
                                <SelectValue placeholder="Statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="suspended">Suspendu</SelectItem>
                                <SelectItem value="banned">Banni</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-destructive transition-colors duration-200"
                              onClick={() => handleDelete(u.id)}
                              disabled={deleteUser.isPending || u.id === me?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
