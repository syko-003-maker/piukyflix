import { useState } from "react";
import {
  useListContent, useCreateContent, useUpdateContent, useDeleteContent,
  useListCategories, useListSeasons, useCreateSeason, useUpdateSeason, useDeleteSeason,
  useListEpisodes, useCreateEpisode, useUpdateEpisode, useDeleteEpisode,
  getListSeasonsQueryKey, getListEpisodesQueryKey
} from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus, ChevronDown, ChevronRight, ChevronLeft, Film, Tv, Star, Search, ArrowUpDown, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/admin/admin-ui";
import { TmdbImport } from "@/components/admin/tmdb-import";
import { tmdbDetails, importTmdbSeries } from "@/lib/tmdb";
import { FileDrop } from "@/components/admin/file-drop";

type ContentType = "movie" | "series";

interface ContentForm {
  title: string;
  description: string;
  contentType: ContentType;
  categoryId: string;
  genre: string;
  releaseYear: string;
  durationMinutes: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  maturityRating: string;
  cast: string;
  director: string;
  tagline: string;
  trailerUrl: string;
  originalLanguage: string;
  country: string;
  isFeatured: boolean;
  isPublished: boolean;
}

const emptyForm: ContentForm = {
  title: "", description: "", contentType: "movie", categoryId: "",
  genre: "", releaseYear: "", durationMinutes: "", posterUrl: "",
  backdropUrl: "", videoUrl: "",
  maturityRating: "", cast: "", director: "", tagline: "", trailerUrl: "",
  originalLanguage: "", country: "",
  isFeatured: false, isPublished: true,
};

export default function AdminContent() {
  const queryClient = useQueryClient();
  const { data: content, isLoading, refetch } = useListContent({ limit: 100, all: true });
  const { data: categories } = useListCategories();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Table UX: search, sort, pagination, bulk selection (all client-side over the loaded list)
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"id" | "title" | "year" | "rating" | "views">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");

  const allItems: any[] = content?.items ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? allItems.filter((it) =>
        it.title.toLowerCase().includes(q) ||
        (it.genre || "").toLowerCase().includes(q) ||
        (it.categoryName || "").toLowerCase().includes(q))
    : allItems;
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
    if (sortKey === "year") return ((a.releaseYear || 0) - (b.releaseYear || 0)) * dir;
    if (sortKey === "rating") return ((a.averageRating || 0) - (b.averageRating || 0)) * dir;
    if (sortKey === "views") return ((a.viewCount || 0) - (b.viewCount || 0)) * dir;
    return (a.id - b.id) * dir;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "title" ? "asc" : "desc"); }
  };
  const toggleSelect = (id: number) =>
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((it) => selected.has(it.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((it) => n.delete(it.id));
      else pageItems.forEach((it) => n.add(it.id));
      return n;
    });
  const bulkDelete = async () => {
    if (!confirm(`Supprimer ${selected.size} contenu(s) ?`)) return;
    await Promise.all([...selected].map((id) => deleteContent.mutateAsync({ id })));
    setSelected(new Set());
    refetch();
  };
  const applyBulkCategory = async () => {
    if (!bulkCategory) return;
    await Promise.all([...selected].map((id) => updateContent.mutateAsync({ id, data: { categoryId: Number(bulkCategory) } as any })));
    setSelected(new Set());
    setBulkCategory("");
    refetch();
  };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: any) => {
    setForm({
      title: item.title || "", description: item.description || "",
      contentType: item.contentType || "movie", categoryId: item.categoryId?.toString() || "",
      genre: item.genre || "", releaseYear: item.releaseYear?.toString() || "",
      durationMinutes: item.durationMinutes?.toString() || "",
      posterUrl: item.posterUrl || "", backdropUrl: item.backdropUrl || "",
      videoUrl: item.videoUrl || "",
      maturityRating: item.maturityRating || "", cast: item.cast || "",
      director: item.director || "", tagline: item.tagline || "",
      trailerUrl: item.trailerUrl || "", originalLanguage: item.originalLanguage || "",
      country: item.country || "",
      isFeatured: item.isFeatured || false,
      isPublished: item.isPublished ?? true,
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title, description: form.description || undefined,
      contentType: form.contentType,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      genre: form.genre || undefined,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      posterUrl: form.posterUrl || undefined, backdropUrl: form.backdropUrl || undefined,
      videoUrl: form.videoUrl || undefined,
      maturityRating: form.maturityRating || undefined, cast: form.cast || undefined,
      director: form.director || undefined, tagline: form.tagline || undefined,
      trailerUrl: form.trailerUrl || undefined, originalLanguage: form.originalLanguage || undefined,
      country: form.country || undefined,
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
    };
    if (editingId) {
      updateContent.mutate({ id: editingId, data: payload as any }, { onSuccess: () => { setModalOpen(false); refetch(); } });
    } else {
      createContent.mutate({ data: payload as any }, { onSuccess: () => { setModalOpen(false); refetch(); } });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer ce contenu ?")) {
      deleteContent.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  const handleTmdbAdd = async (type: "movie" | "series", id: number) => {
    setImportingId(id);
    try {
      if (type === "series") {
        const r = await importTmdbSeries(id);
        refetch();
        setImportingId(null);
        alert(r.created
          ? `Série « ${r.title} » importée : ${r.seasonsAdded} saison(s), ${r.episodesAdded} épisode(s).\nIl ne reste qu'à ajouter la vidéo de chaque épisode (drag'n'drop ou lien).`
          : `Série « ${r.title} » synchronisée : ${r.seasonsAdded} nouvelle(s) saison(s) et ${r.episodesAdded} nouvel(aux) épisode(s) ajoutés (les vidéos existantes sont préservées).`);
        return;
      }
      const d = await tmdbDetails(type, id);
      createContent.mutate(
        {
          data: {
            title: d.title,
            contentType: d.contentType,
            description: d.description ?? undefined,
            releaseYear: d.releaseYear ?? undefined,
            durationMinutes: d.durationMinutes ?? undefined,
            posterUrl: d.posterUrl ?? undefined,
            backdropUrl: d.backdropUrl ?? undefined,
            genre: d.genre ?? undefined,
            tagline: d.tagline ?? undefined,
            originalLanguage: d.originalLanguage ?? undefined,
            cast: d.cast ?? undefined,
            director: d.director ?? undefined,
            trailerUrl: d.trailerUrl ?? undefined,
            country: d.country ?? undefined,
            maturityRating: d.maturityRating ?? undefined,
            tmdbId: d.tmdbId ?? undefined,
          } as any,
        },
        {
          onSuccess: () => { refetch(); setImportingId(null); },
          onError: () => setImportingId(null),
        },
      );
    } catch (e) {
      setImportingId(null);
      alert(e instanceof Error ? e.message : "Import TMDB échoué");
    }
  };

  const f = (key: keyof ContentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Gérer le contenu</h1>
              <p className="text-muted-foreground mt-1">Ajouter, modifier ou supprimer des films et séries</p>
            </div>
            <Button onClick={openAdd}
              className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.03}>
          <div className="mb-6">
            <TmdbImport onAdd={handleTmdbAdd} addingId={importingId} />
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Rechercher un titre, genre, catégorie…"
                className="bg-secondary/50 border-white/10 pl-9 text-white focus-visible:ring-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{sorted.length} résultat{sorted.length > 1 ? "s" : ""}</span>
          </div>
        </Reveal>

        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5"
            >
              <span className="text-sm font-medium text-white">{selected.size} sélectionné(s)</span>
              <div className="flex items-center gap-2">
                <Select value={bulkCategory || "none"} onValueChange={(v) => setBulkCategory(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-8 w-48 bg-secondary border-white/10 text-white text-xs">
                    <SelectValue placeholder="Changer la catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Choisir une catégorie —</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 border-white/10 text-xs text-white hover:bg-secondary"
                  disabled={!bulkCategory} onClick={applyBulkCategory}>Appliquer</Button>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={bulkDelete}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground"
                onClick={() => setSelected(new Set())}>Désélectionner</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Reveal delay={0.05}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const raw = e.dataTransfer.getData("application/x-tmdb");
              if (!raw) return;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.type && parsed.id) handleTmdbAdd(parsed.type, parsed.id);
              } catch { /* ignore */ }
            }}
            className={`bg-card border rounded-2xl overflow-hidden shadow-xl shadow-black/20 transition-colors ${dragOver ? "border-primary ring-2 ring-primary/40" : "border-white/10"}`}
          >
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-8">
                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-white/10 accent-primary align-middle" />
                  </TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                  <TableHead className="text-muted-foreground w-14">ID</TableHead>
                  <TableHead className="text-muted-foreground">
                    <button className="flex items-center gap-1 transition-colors hover:text-white" onClick={() => toggleSort("title")}>
                      Titre <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Catégorie</TableHead>
                  <TableHead className="text-muted-foreground">
                    <button className="flex items-center gap-1 transition-colors hover:text-white" onClick={() => toggleSort("year")}>
                      Année <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button className="flex items-center gap-1 transition-colors hover:text-white" onClick={() => toggleSort("rating")}>
                      Note <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <button className="flex items-center gap-1 transition-colors hover:text-white" onClick={() => toggleSort("views")}>
                      Vues <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                  </TableRow>
                ) : pageItems.map((item: any, i: number) => (
                  <>
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
                      className={`border-b border-white/10 transition-colors hover:bg-secondary/30 ${selected.has(item.id) ? "bg-primary/5" : ""}`}
                    >
                      <TableCell>
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)}
                          className="h-3.5 w-3.5 rounded border-white/10 accent-primary align-middle" />
                      </TableCell>
                      <TableCell>
                        {item.contentType === "series" && (
                          <button
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            className="text-muted-foreground hover:text-white transition-colors"
                          >
                            <motion.span
                              animate={{ rotate: expandedId === item.id ? 90 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 22 }}
                              className="inline-flex"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </motion.span>
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground text-xs">{item.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-12 bg-secondary rounded overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                            {item.posterUrl && <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <span className="font-medium text-white">{item.title}</span>
                            {item.isFeatured && (
                              <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded">
                                À la une
                              </span>
                            )}
                            {item.maturityRating && (
                              <span className="ml-2 text-xs bg-secondary text-gray-300 border border-white/15 px-1.5 py-0.5 rounded">
                                {item.maturityRating}
                              </span>
                            )}
                            {item.isPublished === false && (
                              <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded">
                                Brouillon
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                          {item.contentType === "movie" ? <Film className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
                          {item.contentType === "movie" ? "Film" : "Série"}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">{item.categoryName || "—"}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{item.releaseYear || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {item.averageRating ? (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {item.averageRating.toFixed(1)}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">{item.viewCount.toLocaleString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.contentType === "series" && item.tmdbId && (
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary hover:bg-white/5 h-8 w-8 transition-colors"
                              title="Synchroniser avec TMDB (ajoute les nouveaux épisodes)"
                              disabled={importingId !== null}
                              onClick={() => handleTmdbAdd("series", item.tmdbId)}>
                              <RefreshCw className={`h-4 w-4 ${importingId === item.tmdbId ? "animate-spin" : ""}`} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8 transition-colors"
                            title={item.isPublished === false ? "Publier" : "Mettre en brouillon"}
                            onClick={() => updateContent.mutate({ id: item.id, data: { isPublished: !item.isPublished } as any }, { onSuccess: () => refetch() })}>
                            {item.isPublished === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-8 w-8 transition-colors" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-colors"
                            onClick={() => handleDelete(item.id)} disabled={deleteContent.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                    <AnimatePresence initial={false}>
                      {item.contentType === "series" && expandedId === item.id && (
                        <motion.tr
                          key={`${item.id}-panel`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-b border-white/10 bg-secondary/10"
                        >
                          <TableCell colSpan={10} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <SeasonsPanel contentId={item.id} />
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
                {!isLoading && sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Aucun contenu trouvé</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Reveal>

        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {safePage + 1} / {pageCount}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 border-white/10 text-xs text-white hover:bg-secondary"
                disabled={safePage <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>
              <Button size="sm" variant="outline" className="h-8 border-white/10 text-xs text-white hover:bg-secondary"
                disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                Suivant <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl shadow-black/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
              {editingId ? "Modifier le contenu" : "Ajouter un contenu"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Titre *</Label>
                <Input required value={form.title} onChange={f("title")}
                  placeholder="Titre du contenu" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Type *</Label>
                <Select value={form.contentType}
                  onValueChange={(v) => setForm(prev => ({ ...prev, contentType: v as ContentType }))}>
                  <SelectTrigger className="h-9 bg-secondary border-white/10 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Film</SelectItem>
                    <SelectItem value="series">Série</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Catégorie</Label>
                <Select value={form.categoryId === "" ? "none" : form.categoryId}
                  onValueChange={(v) => setForm(prev => ({ ...prev, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="h-9 bg-secondary border-white/10 text-white">
                    <SelectValue placeholder="— Aucune —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucune —</SelectItem>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Genre</Label>
                <Input value={form.genre} onChange={f("genre")}
                  placeholder="ex: Action, Comédie…" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Année de sortie</Label>
                <Input type="number" value={form.releaseYear} onChange={f("releaseYear")}
                  placeholder="2024" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              {form.contentType === "movie" && (
                <div className="space-y-1.5">
                  <Label className="text-white font-medium">Durée (minutes)</Label>
                  <Input type="number" value={form.durationMinutes} onChange={f("durationMinutes")}
                    placeholder="120" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
                </div>
              )}

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Description</Label>
                <Textarea value={form.description} onChange={f("description")}
                  placeholder="Synopsis du contenu…" rows={3}
                  className="resize-none bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Classification (âge)</Label>
                <Input value={form.maturityRating} onChange={f("maturityRating")}
                  placeholder="ex: PG-13, TV-MA, 16…" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Réalisateur</Label>
                <Input value={form.director} onChange={f("director")}
                  placeholder="Nom du réalisateur" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Langue d'origine</Label>
                <Input value={form.originalLanguage} onChange={f("originalLanguage")}
                  placeholder="ex: en, fr, ja…" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Pays</Label>
                <Input value={form.country} onChange={f("country")}
                  placeholder="Pays d'origine" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Casting</Label>
                <Input value={form.cast} onChange={f("cast")}
                  placeholder="Acteurs séparés par des virgules" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Accroche (tagline)</Label>
                <Input value={form.tagline} onChange={f("tagline")}
                  placeholder="Phrase d'accroche" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Bande-annonce (YouTube)</Label>
                <Input value={form.trailerUrl} onChange={f("trailerUrl")}
                  placeholder="https://www.youtube.com/watch?v=…" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Affiche (poster)</Label>
                <FileDrop value={form.posterUrl} accept="image/*" hint="Glisse une image ici ou clique"
                  onChange={(url) => setForm(prev => ({ ...prev, posterUrl: url }))} />
                <Input value={form.posterUrl} onChange={f("posterUrl")}
                  placeholder="…ou colle une URL" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Image de fond (backdrop)</Label>
                <FileDrop value={form.backdropUrl} accept="image/*" hint="Glisse une image ici ou clique"
                  onChange={(url) => setForm(prev => ({ ...prev, backdropUrl: url }))} />
                <Input value={form.backdropUrl} onChange={f("backdropUrl")}
                  placeholder="…ou colle une URL" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
              </div>

              {form.contentType === "movie" && (
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-white font-medium">Vidéo du film</Label>
                  <FileDrop value={form.videoUrl} accept="video/*" hint="Glisse ta vidéo ici ou clique pour l'uploader"
                    onChange={(url) => setForm(prev => ({ ...prev, videoUrl: url }))} />
                  <Input value={form.videoUrl} onChange={f("videoUrl")}
                    placeholder="…ou colle une URL" className="bg-secondary/50 border-white/10 text-white focus-visible:ring-primary" />
                </div>
              )}

              <div className="col-span-2 flex items-center gap-3 rounded-xl border border-white/10 bg-secondary/30 p-3">
                <input type="checkbox" id="featured" checked={form.isFeatured}
                  onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/10 accent-primary" />
                <Label htmlFor="featured" className="text-white font-medium cursor-pointer">
                  Mettre à la une (affichée dans le hero)
                </Label>
              </div>

              <div className="col-span-2 flex items-center gap-3 rounded-xl border border-white/10 bg-secondary/30 p-3">
                <input type="checkbox" id="published" checked={form.isPublished}
                  onChange={(e) => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/10 accent-primary" />
                <Label htmlFor="published" className="text-white font-medium cursor-pointer">
                  Publié (visible sur le site — décoche pour en faire un brouillon)
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}
                className="border-white/10 text-white hover:bg-secondary">
                Annuler
              </Button>
              <Button type="submit" disabled={createContent.isPending || updateContent.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                {editingId ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeasonsPanel({ contentId }: { contentId: number }) {
  const { data: seasons, refetch: refetchSeasons } = useListSeasons(contentId, {
    query: { queryKey: getListSeasonsQueryKey(contentId) }
  });
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const deleteSeason = useDeleteSeason();
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [addingSeason, setAddingSeason] = useState(false);
  const [editingSeason, setEditingSeason] = useState<number | null>(null);
  const [seasonForm, setSeasonForm] = useState({ seasonNumber: "", title: "", description: "" });

  const resetSeasonForm = () => setSeasonForm({ seasonNumber: "", title: "", description: "" });

  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    createSeason.mutate({
      contentId,
      data: { seasonNumber: Number(seasonForm.seasonNumber), title: seasonForm.title || undefined, description: seasonForm.description || undefined } as any
    }, {
      onSuccess: () => { refetchSeasons(); setAddingSeason(false); resetSeasonForm(); }
    });
  };

  const openEditSeason = (season: any) => {
    setSeasonForm({ seasonNumber: String(season.seasonNumber ?? ""), title: season.title || "", description: season.description || "" });
    setAddingSeason(false);
    setEditingSeason(season.id);
  };

  const handleEditSeason = (e: React.FormEvent, seasonId: number) => {
    e.preventDefault();
    updateSeason.mutate({
      seasonId,
      data: { seasonNumber: Number(seasonForm.seasonNumber), title: seasonForm.title || undefined, description: seasonForm.description || undefined } as any
    }, {
      onSuccess: () => { refetchSeasons(); setEditingSeason(null); resetSeasonForm(); }
    });
  };

  const handleDeleteSeason = (seasonId: number) => {
    if (confirm("Supprimer cette saison et tous ses épisodes ?")) {
      deleteSeason.mutate({ seasonId }, { onSuccess: () => refetchSeasons() });
    }
  };

  const seasonFields = (onSubmit: (e: React.FormEvent) => void, submitLabel: string, onCancel: () => void) => (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 space-y-2 p-3 bg-secondary/30 rounded-xl border border-white/10 overflow-hidden"
    >
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">N° saison</Label>
          <Input type="number" required value={seasonForm.seasonNumber}
            onChange={e => setSeasonForm(p => ({ ...p, seasonNumber: e.target.value }))}
            className="h-8 w-24 bg-secondary border-white/10 text-white text-sm" placeholder="1" />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Titre (optionnel)</Label>
          <Input value={seasonForm.title}
            onChange={e => setSeasonForm(p => ({ ...p, title: e.target.value }))}
            className="h-8 bg-secondary border-white/10 text-white text-sm" placeholder="Titre de la saison" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Description (optionnel)</Label>
        <Textarea value={seasonForm.description}
          onChange={e => setSeasonForm(p => ({ ...p, description: e.target.value }))}
          rows={2} className="resize-none bg-secondary border-white/10 text-white text-sm" placeholder="Résumé de la saison" />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-8 bg-primary text-white text-xs">{submitLabel}</Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 text-muted-foreground text-xs"
          onClick={onCancel}>Annuler</Button>
      </div>
    </motion.form>
  );

  return (
    <div className="px-8 py-4 bg-secondary/5 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Saisons</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 text-white hover:bg-secondary transition-colors"
          onClick={() => { resetSeasonForm(); setEditingSeason(null); setAddingSeason(true); }}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter une saison
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {addingSeason && seasonFields(handleAddSeason, "Créer", () => { setAddingSeason(false); resetSeasonForm(); })}
      </AnimatePresence>

      <div className="space-y-2">
        {seasons?.map(season => (
          <div key={season.id} className="border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-white/20">
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <button
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
              >
                <motion.span
                  animate={{ rotate: expandedSeason === season.id ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="inline-flex"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.span>
                <span className="text-sm font-medium text-white">
                  Saison {season.seasonNumber}{season.title ? ` — ${season.title}` : ""}
                </span>
              </button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => openEditSeason(season)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => handleDeleteSeason(season.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {editingSeason === season.id && (
              <div className="px-4 pt-3">
                {seasonFields((e) => handleEditSeason(e, season.id), "Enregistrer", () => { setEditingSeason(null); resetSeasonForm(); })}
              </div>
            )}
            <AnimatePresence initial={false}>
              {expandedSeason === season.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-3">
                    <EpisodesPanel seasonId={season.id} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {seasons?.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Aucune saison. Ajoutez-en une ci-dessus.</p>
        )}
      </div>
    </div>
  );
}

const emptyEp = { episodeNumber: "", title: "", description: "", videoUrl: "", thumbnailUrl: "", durationMinutes: "", isPublished: true };

function EpisodesPanel({ seasonId }: { seasonId: number }) {
  const { data: episodes, refetch } = useListEpisodes(seasonId, {
    query: { queryKey: getListEpisodesQueryKey(seasonId) }
  });
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();
  const [adding, setAdding] = useState(false);
  const [editingEp, setEditingEp] = useState<number | null>(null);
  const [epForm, setEpForm] = useState({ ...emptyEp });

  const epPayload = () => ({
    episodeNumber: Number(epForm.episodeNumber),
    title: epForm.title,
    description: epForm.description || undefined,
    videoUrl: epForm.videoUrl || undefined,
    thumbnailUrl: epForm.thumbnailUrl || undefined,
    durationMinutes: epForm.durationMinutes ? Number(epForm.durationMinutes) : undefined,
    isPublished: epForm.isPublished,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createEpisode.mutate({ seasonId, data: epPayload() as any },
      { onSuccess: () => { refetch(); setAdding(false); setEpForm({ ...emptyEp }); } });
  };

  const openEditEp = (ep: any) => {
    setEpForm({
      episodeNumber: String(ep.episodeNumber ?? ""), title: ep.title || "",
      description: ep.description || "", videoUrl: ep.videoUrl || "",
      thumbnailUrl: ep.thumbnailUrl || "", durationMinutes: ep.durationMinutes?.toString() || "",
      isPublished: ep.isPublished ?? true,
    });
    setAdding(false);
    setEditingEp(ep.id);
  };

  const handleEdit = (e: React.FormEvent, episodeId: number) => {
    e.preventDefault();
    updateEpisode.mutate({ episodeId, data: epPayload() as any },
      { onSuccess: () => { refetch(); setEditingEp(null); setEpForm({ ...emptyEp }); } });
  };

  const epInputs = (
    <>
      <div className="flex items-center gap-2">
        <Input type="number" required value={epForm.episodeNumber}
          onChange={e => setEpForm(p => ({ ...p, episodeNumber: e.target.value }))}
          placeholder="N°" className="h-7 w-[70px] text-xs bg-secondary border-white/10 text-white" />
        <Input required value={epForm.title}
          onChange={e => setEpForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Titre" className="h-7 flex-1 text-xs bg-secondary border-white/10 text-white" />
        <Input type="number" value={epForm.durationMinutes}
          onChange={e => setEpForm(p => ({ ...p, durationMinutes: e.target.value }))}
          placeholder="min" className="h-7 w-[80px] text-xs bg-secondary border-white/10 text-white" />
      </div>
      <Textarea value={epForm.description}
        onChange={e => setEpForm(p => ({ ...p, description: e.target.value }))}
        rows={2} placeholder="Description (optionnel)" className="resize-none text-xs bg-secondary border-white/10 text-white" />
      <FileDrop value={epForm.videoUrl} accept="video/*" hint="Glisse la vidéo de l'épisode ici ou clique"
        onChange={(url) => setEpForm(p => ({ ...p, videoUrl: url }))} />
      <Input value={epForm.videoUrl}
        onChange={e => setEpForm(p => ({ ...p, videoUrl: e.target.value }))}
        placeholder="…ou colle une URL vidéo (Drive, R2…)" className="h-7 text-xs bg-secondary border-white/10 text-white" />
      <FileDrop value={epForm.thumbnailUrl} accept="image/*" hint="Miniature de l'épisode (optionnel)"
        onChange={(url) => setEpForm(p => ({ ...p, thumbnailUrl: url }))} />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={epForm.isPublished}
          onChange={(e) => setEpForm(p => ({ ...p, isPublished: e.target.checked }))}
          className="h-3.5 w-3.5 rounded border-white/10 accent-primary" />
        Publié (visible sur le site — décoche pour préparer l'épisode sans l'afficher)
      </label>
    </>
  );

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {episodes?.map((ep, i) => (
          <motion.div
            key={ep.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-secondary/20 transition-colors group">
              <span className="text-xs font-bold text-muted-foreground w-5 text-center">{ep.episodeNumber}</span>
              <span className="flex-1 text-sm text-white truncate">{ep.title}</span>
              {!ep.videoUrl && <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-400">sans vidéo</span>}
              {ep.isPublished === false && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">masqué</span>}
              {ep.durationMinutes && <span className="text-xs text-muted-foreground">{ep.durationMinutes} min</span>}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                title={ep.isPublished === false ? "Publier l'épisode" : "Masquer l'épisode"}
                onClick={() => updateEpisode.mutate({ episodeId: ep.id, data: { isPublished: !ep.isPublished } as any }, { onSuccess: () => refetch() })}>
                {ep.isPublished === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                onClick={() => openEditEp(ep)}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                onClick={() => { if (confirm("Supprimer cet épisode ?")) deleteEpisode.mutate({ episodeId: ep.id }, { onSuccess: () => refetch() }); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {editingEp === ep.id && (
              <form onSubmit={(e) => handleEdit(e, ep.id)} className="flex flex-col gap-2 py-2 px-2 border-t border-white/10">
                {epInputs}
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="h-7 text-xs bg-primary text-white">Enregistrer</Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                    onClick={() => { setEditingEp(null); setEpForm({ ...emptyEp }); }}>annuler</Button>
                </div>
              </form>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {adding ? (
          <motion.form
            key="ep-form"
            onSubmit={handleAdd}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2 pt-2 border-t border-white/10 overflow-hidden"
          >
            {epInputs}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" className="h-7 text-xs bg-primary text-white">OK</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                onClick={() => { setAdding(false); setEpForm({ ...emptyEp }); }}>annuler</Button>
            </div>
          </motion.form>
        ) : (
          <motion.button
            key="ep-add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setEpForm({ ...emptyEp }); setEditingEp(null); setAdding(true); }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 pt-1"
          >
            <Plus className="h-3 w-3" /> Ajouter un épisode
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
