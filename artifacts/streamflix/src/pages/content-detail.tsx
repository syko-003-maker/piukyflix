import { useParams, Link } from "wouter";
import { 
  useGetContent, 
  useListEpisodes, 
  useAddFavorite, 
  useRemoveFavorite, 
  useListComments, 
  useAddComment, 
  useGetMe,
  getGetContentQueryKey,
  getListCommentsQueryKey,
  getListEpisodesQueryKey
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Play, Plus, Check, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ContentDetail() {
  const { id } = useParams();
  const contentId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const { data: content, isLoading } = useGetContent(contentId, {
    query: { enabled: !!contentId, queryKey: getGetContentQueryKey(contentId) }
  });

  const { data: comments } = useListComments(contentId, {
    query: { enabled: !!contentId, queryKey: getListCommentsQueryKey(contentId) }
  });

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addComment = useAddComment();

  const [commentText, setCommentText] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  if (content?.contentType === "series" && selectedSeason === null && content.seasons?.length > 0) {
    setSelectedSeason(content.seasons[0].id);
  }

  const { data: episodes } = useListEpisodes(selectedSeason || 0, {
    query: { enabled: !!selectedSeason, queryKey: getListEpisodesQueryKey(selectedSeason || 0) }
  });

  const toggleFavorite = () => {
    if (content?.isFavorite) {
      removeFavorite.mutate({ contentId }, {
        onSuccess: () => {
          queryClient.setQueryData(getGetContentQueryKey(contentId), (old: any) => 
            old ? { ...old, isFavorite: false } : old
          );
        }
      });
    } else {
      addFavorite.mutate({ contentId }, {
        onSuccess: () => {
          queryClient.setQueryData(getGetContentQueryKey(contentId), (old: any) => 
            old ? { ...old, isFavorite: true } : old
          );
        }
      });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate({ contentId, data: { text: commentText } }, {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(contentId) });
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center animate-pulse" />;
  }

  if (!content) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center">Contenu introuvable</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pb-20">
        {/* Bannière */}
        <div className="relative w-full h-[60vh] min-h-[400px]">
          <div className="absolute inset-0 bg-background">
            {content.backdropUrl && (
              <img 
                src={content.backdropUrl} 
                alt={content.title}
                className="w-full h-full object-cover opacity-50 mask-image-gradient"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          
          <div className="container relative z-10 h-full flex flex-col justify-end pb-12 px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-8 items-end md:items-start">
              {content.posterUrl && (
                <div className="hidden md:block w-48 lg:w-64 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl -mt-32">
                  <img src={content.posterUrl} alt={content.title} className="w-full h-auto" />
                </div>
              )}
              
              <div className="flex-1 space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                  {content.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                  {content.releaseYear && <span>{content.releaseYear}</span>}
                  {content.durationMinutes && content.contentType === "movie" && (
                    <span>{Math.floor(content.durationMinutes / 60)}h {content.durationMinutes % 60}min</span>
                  )}
                  {content.contentType === "series" && <span>{content.seasons?.length || 0} saison{(content.seasons?.length || 0) > 1 ? 's' : ''}</span>}
                  {content.genre && <span className="border border-white/20 px-2 py-0.5 rounded text-xs">{content.genre}</span>}
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span>{content.averageRating ? content.averageRating.toFixed(1) : "Non noté"}</span>
                  </div>
                </div>
                
                <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
                  {content.description}
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href={content.contentType === 'movie' ? `/watch/${content.id}` : `/watch/${content.id}?episodeId=${episodes?.[0]?.id || ''}`}>
                    <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8">
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Lire
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/20 hover:bg-white/10 text-white font-bold px-8"
                    onClick={toggleFavorite}
                  >
                    {content.isFavorite ? (
                      <><Check className="mr-2 h-5 w-5" /> Ma liste</>
                    ) : (
                      <><Plus className="mr-2 h-5 w-5" /> Ma liste</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Détails / Épisodes */}
        <div className="container px-4 md:px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {content.contentType === "series" && content.seasons?.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Épisodes</h2>
                  <select 
                    className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedSeason || ""}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  >
                    {content.seasons.map(s => (
                      <option key={s.id} value={s.id}>Saison {s.seasonNumber}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-4">
                  {episodes?.map(ep => (
                    <Link key={ep.id} href={`/watch/${content.id}?episodeId=${ep.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors border border-border group">
                        <div className="text-xl font-bold text-muted-foreground w-8 text-center group-hover:text-white">
                          {ep.episodeNumber}
                        </div>
                        <div className="relative w-32 md:w-40 aspect-video rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                          {ep.thumbnailUrl ? (
                            <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-6 w-6 text-white/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-white truncate">{ep.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ep.description}</p>
                        </div>
                        {ep.durationMinutes && (
                          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
                            {ep.durationMinutes} min
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {episodes?.length === 0 && (
                    <div className="text-muted-foreground text-center py-8 bg-secondary/20 rounded-lg">
                      Aucun épisode trouvé pour cette saison.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Section Commentaires */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Commentaires</h2>
                <span className="bg-secondary text-xs font-bold px-2 py-0.5 rounded-full">{comments?.length || 0}</span>
              </div>
              
              <form onSubmit={handleAddComment} className="flex gap-4">
                <Avatar className="h-10 w-10 mt-1 hidden sm:block">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback>{user?.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ajouter un commentaire…"
                    className="resize-none bg-secondary/50 border-border focus:bg-secondary focus:ring-primary h-20"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!commentText.trim() || addComment.isPending}>
                      Publier
                    </Button>
                  </div>
                </div>
              </form>

              <div className="space-y-6 pt-4">
                {comments?.map(comment => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.avatarUrl || ""} />
                      <AvatarFallback>{comment.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-white text-sm">{comment.username || "Utilisateur"}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary/30 border border-white/5 rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-white text-lg border-b border-border pb-2">À propos</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground font-medium">Catégorie</dt>
                  <dd className="text-white">{content.categoryName || "Non classé"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Genre</dt>
                  <dd className="text-white">{content.genre || "—"}</dd>
                </div>
                {content.contentType === "movie" && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Durée</dt>
                    <dd className="text-white">{content.durationMinutes ? `${content.durationMinutes} minutes` : "—"}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground font-medium">Année de sortie</dt>
                  <dd className="text-white">{content.releaseYear || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium">Vues</dt>
                  <dd className="text-white">{content.viewCount.toLocaleString("fr-FR")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
