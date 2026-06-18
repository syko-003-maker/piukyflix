import { useState } from "react";
import {
  useListContent, useCreateContent, useUpdateContent, useDeleteContent,
  useListCategories, useListSeasons, useCreateSeason, useDeleteSeason,
  useListEpisodes, useCreateEpisode, useDeleteEpisode,
  getListSeasonsQueryKey, getListEpisodesQueryKey
} from "@workspace/api-client-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, ChevronDown, ChevronRight, Film, Tv, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
  isFeatured: boolean;
}

const emptyForm: ContentForm = {
  title: "", description: "", contentType: "movie", categoryId: "",
  genre: "", releaseYear: "", durationMinutes: "", posterUrl: "",
  backdropUrl: "", videoUrl: "", isFeatured: false,
};

export default function AdminContent() {
  const queryClient = useQueryClient();
  const { data: content, isLoading, refetch } = useListContent({ limit: 100 });
  const { data: categories } = useListCategories();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (item: any) => {
    setForm({
      title: item.title || "", description: item.description || "",
      contentType: item.contentType || "movie", categoryId: item.categoryId?.toString() || "",
      genre: item.genre || "", releaseYear: item.releaseYear?.toString() || "",
      durationMinutes: item.durationMinutes?.toString() || "",
      posterUrl: item.posterUrl || "", backdropUrl: item.backdropUrl || "",
      videoUrl: item.videoUrl || "", isFeatured: item.isFeatured || false,
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
      videoUrl: form.videoUrl || undefined, isFeatured: form.isFeatured,
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

  const f = (key: keyof ContentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gérer le contenu</h1>
            <p className="text-muted-foreground mt-1">Ajouter, modifier ou supprimer des films et séries</p>
          </div>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-10"></TableHead>
                <TableHead className="text-muted-foreground w-14">ID</TableHead>
                <TableHead className="text-muted-foreground">Titre</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Catégorie</TableHead>
                <TableHead className="text-muted-foreground">Année</TableHead>
                <TableHead className="text-muted-foreground">Note</TableHead>
                <TableHead className="text-muted-foreground">Vues</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Chargement…</TableCell>
                </TableRow>
              ) : content?.items.map(item => (
                <>
                  <TableRow key={item.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      {item.contentType === "series" && (
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="text-muted-foreground hover:text-white transition-colors"
                        >
                          {expandedId === item.id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground text-xs">{item.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                          {item.posterUrl && <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <span className="font-medium text-white">{item.title}</span>
                          {item.isFeatured && (
                            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded">
                              À la une
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
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8" onClick={() => openEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-destructive h-8 w-8"
                          onClick={() => handleDelete(item.id)} disabled={deleteContent.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {item.contentType === "series" && expandedId === item.id && (
                    <TableRow className="border-border bg-secondary/10">
                      <TableCell colSpan={9} className="p-0">
                        <SeasonsPanel contentId={item.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {content?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Aucun contenu trouvé</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Modal Add/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Modifier le contenu" : "Ajouter un contenu"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Titre *</Label>
                <Input required value={form.title} onChange={f("title")}
                  placeholder="Titre du contenu" className="bg-secondary/50 border-border text-white" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Type *</Label>
                <select value={form.contentType} onChange={f("contentType")}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="movie">Film</option>
                  <option value="series">Série</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Catégorie</Label>
                <select value={form.categoryId} onChange={f("categoryId")}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">— Aucune —</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Genre</Label>
                <Input value={form.genre} onChange={f("genre")}
                  placeholder="ex: Action, Comédie…" className="bg-secondary/50 border-border text-white" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white font-medium">Année de sortie</Label>
                <Input type="number" value={form.releaseYear} onChange={f("releaseYear")}
                  placeholder="2024" className="bg-secondary/50 border-border text-white" />
              </div>

              {form.contentType === "movie" && (
                <div className="space-y-1.5">
                  <Label className="text-white font-medium">Durée (minutes)</Label>
                  <Input type="number" value={form.durationMinutes} onChange={f("durationMinutes")}
                    placeholder="120" className="bg-secondary/50 border-border text-white" />
                </div>
              )}

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">Description</Label>
                <Textarea value={form.description} onChange={f("description")}
                  placeholder="Synopsis du contenu…" rows={3}
                  className="resize-none bg-secondary/50 border-border text-white" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">URL Poster</Label>
                <Input value={form.posterUrl} onChange={f("posterUrl")}
                  placeholder="https://…" className="bg-secondary/50 border-border text-white" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white font-medium">URL Backdrop</Label>
                <Input value={form.backdropUrl} onChange={f("backdropUrl")}
                  placeholder="https://…" className="bg-secondary/50 border-border text-white" />
              </div>

              {form.contentType === "movie" && (
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-white font-medium">URL Vidéo</Label>
                  <Input value={form.videoUrl} onChange={f("videoUrl")}
                    placeholder="https://…" className="bg-secondary/50 border-border text-white" />
                </div>
              )}

              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.isFeatured}
                  onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-primary" />
                <Label htmlFor="featured" className="text-white font-medium cursor-pointer">
                  Mettre à la une (affichée dans le hero)
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}
                className="border-border text-white hover:bg-secondary">
                Annuler
              </Button>
              <Button type="submit" disabled={createContent.isPending || updateContent.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-bold">
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
  const queryClient = useQueryClient();
  const { data: seasons, refetch: refetchSeasons } = useListSeasons(contentId, {
    query: { queryKey: getListSeasonsQueryKey(contentId) }
  });
  const createSeason = useCreateSeason();
  const deleteSeason = useDeleteSeason();
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [addingSeason, setAddingSeason] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ seasonNumber: "", title: "" });

  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    createSeason.mutate({
      contentId,
      data: { seasonNumber: Number(seasonForm.seasonNumber), title: seasonForm.title || undefined } as any
    }, {
      onSuccess: () => { refetchSeasons(); setAddingSeason(false); setSeasonForm({ seasonNumber: "", title: "" }); }
    });
  };

  const handleDeleteSeason = (seasonId: number) => {
    if (confirm("Supprimer cette saison et tous ses épisodes ?")) {
      deleteSeason.mutate({ seasonId }, { onSuccess: () => refetchSeasons() });
    }
  };

  return (
    <div className="px-8 py-4 bg-secondary/5 border-t border-border/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Saisons</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs border-border text-white hover:bg-secondary"
          onClick={() => setAddingSeason(true)}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter une saison
        </Button>
      </div>

      {addingSeason && (
        <form onSubmit={handleAddSeason} className="flex items-end gap-3 mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">N° saison</Label>
            <Input type="number" required value={seasonForm.seasonNumber}
              onChange={e => setSeasonForm(p => ({ ...p, seasonNumber: e.target.value }))}
              className="h-8 w-24 bg-secondary border-border text-white text-sm" placeholder="1" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Titre (optionnel)</Label>
            <Input value={seasonForm.title}
              onChange={e => setSeasonForm(p => ({ ...p, title: e.target.value }))}
              className="h-8 bg-secondary border-border text-white text-sm" placeholder="Titre de la saison" />
          </div>
          <Button type="submit" size="sm" className="h-8 bg-primary text-white text-xs">Créer</Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 text-muted-foreground text-xs"
            onClick={() => setAddingSeason(false)}>Annuler</Button>
        </form>
      )}

      <div className="space-y-2">
        {seasons?.map(season => (
          <div key={season.id} className="border border-border/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <button
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
              >
                {expandedSeason === season.id
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium text-white">
                  Saison {season.seasonNumber}{season.title ? ` — ${season.title}` : ""}
                </span>
              </button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteSeason(season.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {expandedSeason === season.id && (
              <div className="px-4 py-3">
                <EpisodesPanel seasonId={season.id} />
              </div>
            )}
          </div>
        ))}
        {seasons?.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Aucune saison. Ajoutez-en une ci-dessus.</p>
        )}
      </div>
    </div>
  );
}

function EpisodesPanel({ seasonId }: { seasonId: number }) {
  const { data: episodes, refetch } = useListEpisodes(seasonId, {
    query: { queryKey: getListEpisodesQueryKey(seasonId) }
  });
  const createEpisode = useCreateEpisode();
  const deleteEpisode = useDeleteEpisode();
  const [adding, setAdding] = useState(false);
  const [epForm, setEpForm] = useState({ episodeNumber: "", title: "", videoUrl: "", durationMinutes: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createEpisode.mutate({
      seasonId,
      data: {
        episodeNumber: Number(epForm.episodeNumber),
        title: epForm.title,
        videoUrl: epForm.videoUrl || undefined,
        durationMinutes: epForm.durationMinutes ? Number(epForm.durationMinutes) : undefined,
      } as any
    }, { onSuccess: () => { refetch(); setAdding(false); setEpForm({ episodeNumber: "", title: "", videoUrl: "", durationMinutes: "" }); } });
  };

  return (
    <div className="space-y-2">
      {episodes?.map(ep => (
        <div key={ep.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-secondary/20 group">
          <span className="text-xs font-bold text-muted-foreground w-5 text-center">{ep.episodeNumber}</span>
          <span className="flex-1 text-sm text-white">{ep.title}</span>
          {ep.durationMinutes && <span className="text-xs text-muted-foreground">{ep.durationMinutes} min</span>}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
            onClick={() => { if (confirm("Supprimer cet épisode ?")) deleteEpisode.mutate({ episodeId: ep.id }, { onSuccess: () => refetch() }); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="grid grid-cols-4 gap-2 pt-2 border-t border-border/30">
          <Input type="number" required value={epForm.episodeNumber}
            onChange={e => setEpForm(p => ({ ...p, episodeNumber: e.target.value }))}
            placeholder="N°" className="h-7 text-xs bg-secondary border-border text-white" />
          <Input required value={epForm.title}
            onChange={e => setEpForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Titre" className="h-7 text-xs bg-secondary border-border text-white col-span-2" />
          <Input type="number" value={epForm.durationMinutes}
            onChange={e => setEpForm(p => ({ ...p, durationMinutes: e.target.value }))}
            placeholder="min" className="h-7 text-xs bg-secondary border-border text-white" />
          <Input value={epForm.videoUrl}
            onChange={e => setEpForm(p => ({ ...p, videoUrl: e.target.value }))}
            placeholder="URL vidéo" className="h-7 text-xs bg-secondary border-border text-white col-span-2" />
          <Button type="submit" size="sm" className="h-7 text-xs bg-primary text-white">OK</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
            onClick={() => setAdding(false)}>✕</Button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 pt-1">
          <Plus className="h-3 w-3" /> Ajouter un épisode
        </button>
      )}
    </div>
  );
}
