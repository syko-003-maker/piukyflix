import { Navbar } from "@/components/layout/Navbar";
import { useGetFeaturedContent, useListContent, useListWatchHistory, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Play, Info, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@clerk/react";
import { ContentRow } from "@/components/content/content-row";
import { ContentCard } from "@/components/content/content-card";

const chipClass = (active: boolean) =>
  `flex-none whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active ? "border-primary bg-primary text-white" : "border-white/15 bg-secondary/40 text-gray-300 hover:bg-secondary"
  }`;

export default function Browse() {
  const { isSignedIn } = useAuth();
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedContent();
  const { data: categories } = useListCategories();
  const { data: content, isLoading: isLoadingContent } = useListContent({ limit: 100, ...(selectedCat ? { categoryId: selectedCat } : {}) });
  const { data: history } = useListWatchHistory({ query: { enabled: !!isSignedIn } });

  const items: any[] = content?.items ?? [];
  const heroItem: any = featured?.[0] || items[0];
  const continueWatching = (history ?? []).filter((h) => !h.completed).slice(0, 12);
  const movies = items.filter((i) => i.contentType === "movie");
  const series = items.filter((i) => i.contentType === "series");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero cinématique */}
        {isLoadingFeatured || isLoadingContent ? (
          <div className="h-[80vh] w-full animate-pulse bg-secondary" />
        ) : heroItem ? (
          <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden">
            <div className="absolute inset-0">
              {heroItem.backdropUrl && (
                <img src={heroItem.backdropUrl} alt={heroItem.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />
            </div>

            <div className="container relative z-10 flex h-full flex-col justify-end px-4 pb-28 md:px-6">
              <div className="max-w-2xl space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-200">
                  {heroItem.averageRating != null && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      {Number(heroItem.averageRating).toFixed(1)}
                    </span>
                  )}
                  {heroItem.releaseYear && <span>{heroItem.releaseYear}</span>}
                  {heroItem.maturityRating && <span className="rounded border border-white/30 px-1.5 text-xs">{heroItem.maturityRating}</span>}
                  {heroItem.genre && <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs text-primary">{heroItem.genre}</span>}
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
                  {heroItem.title}
                </h1>
                <p className="line-clamp-3 max-w-xl text-base text-gray-200 drop-shadow md:text-lg">{heroItem.description}</p>
                <div className="flex gap-3 pt-2">
                  <Link href={`/watch/${heroItem.id}`}>
                    <Button size="lg" className="bg-white px-8 font-bold text-black hover:bg-white/85">
                      <Play className="mr-2 h-5 w-5 fill-current" /> Lire
                    </Button>
                  </Link>
                  <Link href={`/content/${heroItem.id}`}>
                    <Button size="lg" variant="secondary" className="bg-white/15 px-8 font-bold text-white backdrop-blur hover:bg-white/25">
                      <Info className="mr-2 h-5 w-5" /> Plus d'infos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Contenu (remonte sous le hero) */}
        <div className="container relative z-10 -mt-16 space-y-8 px-4 pb-20 md:px-6">
          {categories && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => setSelectedCat(null)} className={chipClass(selectedCat === null)}>
                Tout
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  style={selectedCat === c.id && c.color ? { backgroundColor: c.color, borderColor: c.color } : undefined}
                  className={chipClass(selectedCat === c.id)}
                >
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {selectedCat ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
              {items.length === 0 && !isLoadingContent && (
                <p className="col-span-full py-12 text-center text-muted-foreground">Aucun contenu dans cette catégorie.</p>
              )}
            </div>
          ) : (
            <>
              {continueWatching.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xl font-bold text-white md:text-2xl">Continuer à regarder</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {continueWatching.map((entry) => (
                      <Link
                        key={entry.id}
                        href={entry.content?.contentType === "movie" ? `/watch/${entry.contentId}` : `/watch/${entry.contentId}?episodeId=${entry.episodeId}`}
                      >
                        <div className="group relative aspect-video w-64 flex-none overflow-hidden rounded-xl bg-secondary ring-1 ring-white/5 transition-transform duration-300 hover:scale-[1.03]">
                          {entry.content?.backdropUrl ? (
                            <img src={entry.content.backdropUrl} alt={entry.content.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Play className="h-8 w-8 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="h-12 w-12 fill-white text-white drop-shadow" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="truncate text-sm font-semibold text-white drop-shadow">{entry.content?.title}</h3>
                            {entry.content?.durationMinutes && entry.progressSeconds > 0 && (
                              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (entry.progressSeconds / (entry.content.durationMinutes * 60)) * 100)}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <ContentRow title="Films" items={movies} />
              <ContentRow title="Séries" items={series} />
              {categories?.map((c) => (
                <ContentRow key={c.id} title={`${c.icon ? c.icon + " " : ""}${c.name}`} items={items.filter((i) => i.categoryId === c.id)} />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
