import { Navbar } from "@/components/layout/Navbar";
import { useGetFeaturedContent, useListContent, useListWatchHistory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@clerk/react";

export default function Browse() {
  const { isSignedIn } = useAuth();
  const [limit, setLimit] = useState(20);
  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedContent();
  const { data: content, isLoading: isLoadingContent } = useListContent({ limit });
  const { data: history } = useListWatchHistory({ query: { enabled: !!isSignedIn } });

  const heroItem = featured?.[0] || content?.items?.[0];
  const continueWatching = (history ?? []).filter((h) => !h.completed).slice(0, 12);
  const hasMore = !!content && content.items.length < content.total;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Section Hero */}
        {isLoadingFeatured || isLoadingContent ? (
          <div className="w-full h-[70vh] bg-secondary animate-pulse" />
        ) : heroItem ? (
          <section className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-background">
              {heroItem.backdropUrl && (
                <img 
                  src={heroItem.backdropUrl} 
                  alt={heroItem.title}
                  className="w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            </div>
            
            <div className="container relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-6">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                  {heroItem.title}
                </h1>
                <p className="text-lg text-gray-200 line-clamp-3 drop-shadow-md">
                  {heroItem.description}
                </p>
                
                <div className="flex gap-4 pt-4">
                  <Link href={`/watch/${heroItem.id}`}>
                    <Button size="lg" className="bg-white text-black hover:bg-white/80 font-bold px-8">
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Lire
                    </Button>
                  </Link>
                  <Link href={`/content/${heroItem.id}`}>
                    <Button size="lg" variant="secondary" className="bg-secondary/80 text-white hover:bg-secondary font-bold px-8 backdrop-blur-sm">
                      <Info className="mr-2 h-5 w-5" />
                      Plus d'infos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Grilles de contenu */}
        <div className="container px-4 md:px-6 py-8 space-y-12">
          {continueWatching.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Continuer à regarder</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {continueWatching.map((entry) => (
                  <Link
                    key={entry.id}
                    href={
                      entry.content?.contentType === "movie"
                        ? `/watch/${entry.contentId}`
                        : `/watch/${entry.contentId}?episodeId=${entry.episodeId}`
                    }
                  >
                    <div className="relative group cursor-pointer flex-none w-64 aspect-video rounded-md overflow-hidden bg-secondary transition-transform duration-300 hover:scale-105">
                      {entry.content?.backdropUrl ? (
                        <img src={entry.content.backdropUrl} alt={entry.content.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <span className="font-bold text-white">{entry.content?.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-10 w-10 text-white fill-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h3 className="text-white text-sm font-semibold truncate drop-shadow">{entry.content?.title}</h3>
                        {entry.content?.durationMinutes && entry.progressSeconds > 0 && (
                          <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(100, (entry.progressSeconds / (entry.content.durationMinutes * 60)) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Tendances actuelles</h2>
            {isLoadingContent ? (
              <div className="flex gap-4 overflow-hidden">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex-none w-48 h-72 bg-secondary animate-pulse rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {content?.items.map(item => (
                  <Link key={item.id} href={`/content/${item.id}`}>
                    <div className="relative group cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-secondary transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-black/50">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <span className="font-bold text-white">{item.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <h3 className="text-white font-bold text-sm truncate">{item.title}</h3>
                        <div className="flex items-center text-xs text-gray-300 gap-2 mt-1">
                          <span>{item.releaseYear}</span>
                          {item.durationMinutes && <span>{item.durationMinutes} min</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setLimit((l) => l + 20)}
                  variant="secondary"
                  disabled={isLoadingContent}
                  className="bg-secondary/80 text-white hover:bg-secondary font-semibold px-8"
                >
                  Charger plus
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
