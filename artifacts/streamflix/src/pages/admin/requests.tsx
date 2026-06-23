import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reveal } from "@/components/admin/admin-ui";
import { MessageSquarePlus, Trash2, ChevronUp } from "lucide-react";

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
const STATUS_CLS: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground border-white/10",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  done: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AdminRequests() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

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
  const pending = reqs.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal>
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-card p-3 text-primary">
              <MessageSquarePlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Demandes</h1>
              <p className="mt-1 text-muted-foreground">{reqs.length} demande{reqs.length !== 1 ? "s" : ""} · {pending} en attente</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          {loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card p-10 text-center text-muted-foreground">Aucune demande pour l'instant.</div>
          ) : (
            <div className="space-y-3">
              {sorted.map((r) => (
                <div key={r.id} className="flex items-start gap-4 rounded-xl border border-white/10 bg-card p-4">
                  <div className="flex flex-col items-center rounded-lg border border-white/10 px-3 py-1.5 text-muted-foreground">
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm font-bold text-white">{r.votes}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{r.title}</h3>
                      <span className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] text-gray-300">{TYPE_LABEL[r.type] ?? r.type}</span>
                    </div>
                    {r.note && <p className="mt-1 text-sm text-gray-400">{r.note}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">par {r.requestedBy || "Anonyme"} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                      <SelectTrigger className={`h-8 w-32 border text-xs ${STATUS_CLS[r.status] ?? "border-white/10"}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Acceptée</SelectItem>
                        <SelectItem value="done">Ajoutée</SelectItem>
                        <SelectItem value="rejected">Refusée</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </main>
    </div>
  );
}
