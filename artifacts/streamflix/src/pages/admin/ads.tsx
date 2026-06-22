import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/admin/admin-ui";
import { FileDrop } from "@/components/admin/file-drop";
import { Megaphone, Trash2, Plus, Eye, EyeOff } from "lucide-react";

interface Ad {
  id: number;
  type: string;
  url: string;
  title: string | null;
  durationSeconds: number;
  enabled: boolean;
  createdAt: string;
}

const emptyForm = { type: "video", url: "", title: "", durationSeconds: "5" };

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ads");
      if (r.ok) setAds(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) return;
    setAdding(true);
    try {
      const r = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, url: form.url, title: form.title || undefined, durationSeconds: Number(form.durationSeconds) || 5 }),
      });
      if (r.ok) { setForm({ ...emptyForm }); load(); }
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (ad: Ad) => {
    await fetch(`/api/ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !ad.enabled }) });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Supprimer cette publicité ?")) return;
    await fetch(`/api/ads/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-card p-3 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Publicité</h1>
              <p className="mt-1 text-muted-foreground">Pub pré-roll diffusée aux utilisateurs gratuits avant la lecture (jamais aux VIP ni au staff)</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <form onSubmit={create} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-card p-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-white font-medium">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="h-9 bg-secondary border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white font-medium">Skip autorisé après (secondes)</Label>
              <Input type="number" value={form.durationSeconds} onChange={(e) => setForm((p) => ({ ...p, durationSeconds: e.target.value }))} className="bg-secondary/50 border-white/10 text-white" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-white font-medium">Titre (optionnel)</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="ex: Promo abonnement VIP" className="bg-secondary/50 border-white/10 text-white" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-white font-medium">Média de la pub</Label>
              <FileDrop value={form.url} accept={form.type === "image" ? "image/*" : "video/*"} hint="Glisse la pub (vidéo ou image) ici ou clique"
                onChange={(url) => setForm((p) => ({ ...p, url }))} />
              <Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="…ou colle une URL" className="bg-secondary/50 border-white/10 text-white" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={adding || !form.url} className="bg-primary text-white font-bold shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Ajouter la pub
              </Button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-3">
            {loading ? (
              <p className="text-muted-foreground">Chargement…</p>
            ) : ads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-card p-8 text-center text-muted-foreground">
                Aucune publicité. Ajoute-en une ci-dessus — les VIP n'en verront jamais.
              </div>
            ) : (
              ads.map((ad) => (
                <div key={ad.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-card p-4">
                  <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded bg-secondary">
                    {ad.type === "image" ? (
                      <img src={ad.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={ad.url} muted className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{ad.title || (ad.type === "image" ? "Image publicitaire" : "Vidéo publicitaire")}</p>
                    <p className="text-xs text-muted-foreground">
                      Skip après {ad.durationSeconds}s · {ad.enabled ? <span className="text-green-400">activée</span> : <span className="text-muted-foreground">désactivée</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" title={ad.enabled ? "Désactiver" : "Activer"} onClick={() => toggle(ad)}>
                    {ad.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => remove(ad.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Reveal>
      </main>
    </div>
  );
}
