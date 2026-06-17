import { Navbar } from "@/components/layout/Navbar";
import { useSearchContent, getSearchContentQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, Film, Tv } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  const { data: results, isLoading } = useSearchContent(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 1, queryKey: getSearchContentQueryKey({ q: debouncedQuery }) } }
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input 
              autoFocus
              className="w-full h-16 pl-14 text-xl bg-secondary/50 border-white/10 text-white rounded-full focus-visible:ring-primary focus-visible:border-primary"
              placeholder="Search for movies, series, or genres..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {isLoading && debouncedQuery.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[2/3] bg-secondary animate-pulse rounded-md" />
                ))}
              </div>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.map(item => (
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
            )}

            {!isLoading && debouncedQuery.length > 1 && (!results || results.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-white mb-2">No results found</p>
                <p>Try searching for a different title, genre, or keyword.</p>
              </div>
            )}
            
            {debouncedQuery.length <= 1 && (
              <div className="text-center py-20 text-muted-foreground">
                <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-white mb-2">Find your next favorite</p>
                <p>Search across thousands of movies and TV shows.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}