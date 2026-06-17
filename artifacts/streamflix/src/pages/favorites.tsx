import { Navbar } from "@/components/layout/Navbar";
import { useListFavorites } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Heart, Film, Tv } from "lucide-react";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-white">My List</h1>
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
              <Link key={item.id} href={`/content/${item.id}`}>
                <div className="relative group cursor-pointer aspect-[2/3] rounded-md overflow-hidden bg-secondary transition-transform duration-300 hover:scale-105 hover:z-10 shadow-lg">
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2">
                      {item.contentType === 'movie' ? <Film className="h-8 w-8 text-muted-foreground" /> : <Tv className="h-8 w-8 text-muted-foreground" />}
                      <span className="font-bold text-white text-sm">{item.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold text-sm truncate">{item.title}</h3>
                    <div className="flex items-center text-xs text-gray-300 gap-2 mt-1">
                      <span>{item.releaseYear}</span>
                      <span className="capitalize border border-white/20 px-1.5 rounded">{item.contentType}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 text-muted-foreground bg-secondary/20 rounded-xl border border-white/5">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-2xl font-bold text-white mb-2">Your list is empty</p>
            <p className="max-w-md mx-auto">
              Add shows and movies that you want to watch later by clicking the "My List" button on their details page.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}