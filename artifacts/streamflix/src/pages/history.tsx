import { Navbar } from "@/components/layout/Navbar";
import { useListWatchHistory } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Clock, Play, Film, Tv } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function History() {
  const { data: history, isLoading } = useListWatchHistory();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-white">Continuer à regarder</h1>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-secondary animate-pulse rounded-md" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map(entry => (
              <Link 
                key={entry.id} 
                href={
                  entry.content?.contentType === 'movie' 
                    ? `/watch/${entry.contentId}` 
                    : `/watch/${entry.contentId}?episodeId=${entry.episodeId}`
                }
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors border border-border group items-center">
                  <div className="relative w-full sm:w-48 aspect-video rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                    {entry.content?.backdropUrl ? (
                      <img src={entry.content.backdropUrl} alt={entry.content.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="h-10 w-10 text-white fill-white" />
                    </div>
                    {entry.content?.durationMinutes && entry.progressSeconds > 0 && (
                       <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                         <div 
                           className="h-full bg-primary" 
                           style={{ width: `${Math.min(100, (entry.progressSeconds / (entry.content.durationMinutes * 60)) * 100)}%` }} 
                         />
                       </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-2 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.content?.contentType === 'movie' ? <Film className="h-4 w-4 text-muted-foreground" /> : <Tv className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {entry.content?.contentType === 'movie' ? 'Film' : 'Série'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate">{entry.content?.title || "Contenu inconnu"}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {entry.content?.description}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Vu le : {format(new Date(entry.watchedAt), "d MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 text-muted-foreground bg-secondary/20 rounded-xl border border-white/5">
            <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-2xl font-bold text-white mb-2">Aucun historique de visionnage</p>
            <p className="max-w-md mx-auto">
              Les titres que vous commencez à regarder apparaîtront ici pour que vous puissiez reprendre là où vous vous êtes arrêté.
            </p>
            <Link href="/browse">
              <span className="inline-block mt-6 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md transition-colors">
                Explorer le catalogue
              </span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
