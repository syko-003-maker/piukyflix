import { Navbar } from "@/components/layout/Navbar";
import { useListFavorites } from "@workspace/api-client-react";
import { Heart } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-white">Ma liste</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="aspect-[2/3] bg-secondary animate-pulse rounded-md" />
            ))}
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 text-muted-foreground bg-secondary/20 rounded-xl border border-white/5">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-2xl font-bold text-white mb-2">Votre liste est vide</p>
            <p className="max-w-md mx-auto">
              Ajoutez des films et séries à regarder plus tard en cliquant sur « Ma liste » sur leur page de détail.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
