import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMe } from "@workspace/api-client-react";
import { ChevronUp, Trash2, Send, MessageSquarePlus } from "lucide-react";

interface Req {
  id: number;
  title: string;
  type: string;
  note: string | null;
  status: string;
  createdAt: string;
  requestedBy: string | null;
  votes: number;
  hasVoted: boolean;
  mine: boolean;
}

const TYPE_LABEL: Record<string, string> = { movie: "Film", series: "Série", any: "Indifférent" };
const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-secondary text-muted-foreground border-white/10" },
  approved: { label: "Acceptée", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  done: { label: "Ajoutée", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  rejected: { label: "Refusée", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Requests() {
  const { data: me } = useGetMe();
  const isStaff = me?.role === "admin" || me?.role === "moderator";
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", type: "any", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/requests");
      if (r.ok) setReqs(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, type: form.type, note: form.note || undefined }),
      });
      if (r.ok) { setForm({ title: "", type: "any", note: "" }); load(); }
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (id: number) => { await fetch(`/api/requests/${id}/vote`, { method: "POST" }); load(); };
  const setStatus = async (id: number, status: string) => {
    await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm("Supprimer cette demande ?")) return;
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    load();
  };

  const sorted = [...reqs].sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-3xl px-4 md:px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <MessageSquarePlus className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">Demandes de films & séries</h1>
            <p className="mt-1 text-muted-foreground">Proposez un titre et votez pour ceux que vous voulez voir ajoutés.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mb-10 space-y-3 rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Titre du film ou de la série…" className="flex-1 bg-secondary/50 border-white/10 text-white" />
            <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
              <SelectTrigger className="h-10 w-full sm:w-44 bg-secondary border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Indifférent</SelectItem>
                <SelectItem value="movie">Film</SelectItem>
                <SelectItem value="series">Série</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            rows={2} placeholder="Précisions (optionnel)…" className="resize-none bg-secondary/50 border-white/10 text-white" />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !form.title.trim()} className="bg-primary text-white font-bold shadow-lg shadow-primary/20">
              <Send className="mr-2 h-4 w-4" /> Envoyer la demande
            </Button>
          </div>
        </form>

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card p-10 text-center text-muted-foreground">
            Aucune demande pour l'instant. Soyez le premier à en proposer une !
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((r) => (
              <div key={r.id} className="flex items-start gap-4 rounded-xl border border-white/10 bg-card p-4">
                <button
                  onClick={() => vote(r.id)}
                  className={`flex flex-col items-center rounded-lg border px-3 py-1.5 transition-colors ${r.hasVoted ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-white"}`}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-sm font-bold">{r.votes}</span>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{r.title}</h3>
                    <span className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] text-gray-300">{TYPE_LABEL[r.type] ?? r.type}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS[r.status]?.cls ?? ""}`}>{STATUS[r.status]?.label ?? r.status}</span>
                  </div>
                  {r.note && <p className="mt-1 text-sm text-gray-400">{r.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">par {r.requestedBy || "Anonyme"}</p>
                </div>

                <div className="flex items-center gap-1">
                  {isStaff && (
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32 bg-secondary border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Acceptée</SelectItem>
                        <SelectItem value="done">Ajoutée</SelectItem>
                        <SelectItem value="rejected">Refusée</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {(isStaff || r.mine) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
