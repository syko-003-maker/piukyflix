import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2, Film, Tv, Clapperboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTmdb, type TmdbResult } from "@/lib/tmdb";

type MediaType = "movie" | "series";

export function TmdbImport({
  onAdd,
  addingId,
}: {
  onAdd: (type: MediaType, id: number) => void;
  addingId?: number | null;
}) {
  const [type, setType] = useState<MediaType>("movie");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const q = debounced.trim();
    if (!q) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    searchTmdb(q, type)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, type]);

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Clapperboard className="h-4 w-4" />
          </span>
          <h2 className="font-bold">Importer depuis TMDB</h2>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-secondary/60 p-0.5">
          {(["movie", "series"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
              }`}
            >
              {t === "movie" ? <Film className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
              {t === "movie" ? "Films" : "Séries"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={type === "movie" ? "Rechercher un film…" : "Rechercher une série…"}
          className="bg-secondary/50 border-white/10 pl-9 text-white"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs text-muted-foreground">
            Clique pour ajouter, ou glisse une affiche vers le tableau ci-dessous.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <AnimatePresence>
              {results.map((r, i) => {
                const busy = addingId === r.id;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("application/x-tmdb", JSON.stringify({ type, id: r.id }))
                      }
                      onClick={() => onAdd(type, r.id)}
                      disabled={busy}
                      title={`Ajouter « ${r.title} »`}
                      className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-secondary/40 text-left transition-all hover:-translate-y-1 hover:border-primary/40 disabled:opacity-50"
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden bg-secondary">
                        {r.posterUrl ? (
                          <img src={r.posterUrl} alt={r.title} className="h-full w-full object-cover" draggable={false} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                            {r.title}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {busy ? (
                            <Loader2 className="h-7 w-7 animate-spin text-white" />
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
                              <Plus className="h-3.5 w-3.5" /> Ajouter
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-medium text-white">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">{r.year || "—"}</p>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
