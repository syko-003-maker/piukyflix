import { Navbar } from "@/components/layout/Navbar";
import { useSearchContent, getSearchContentQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { ContentCard } from "@/components/content/content-card";

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  const { data: results, isLoading } = useSearchContent(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 1, queryKey: getSearchContentQueryKey({ q: debouncedQuery }) } }
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input 
              autoFocus
              className="w-full h-16 pl-14 text-xl bg-secondary/50 border-white/10 text-white rounded-full focus-visible:ring-primary focus-visible:border-primary"
              placeholder="Rechercher des films, séries ou genres..."
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
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {!isLoading && debouncedQuery.length > 1 && (!results || results.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-white mb-2">Aucun résultat trouvé</p>
                <p>Essayez un autre titre, genre ou mot-clé.</p>
              </div>
            )}
            
            {debouncedQuery.length <= 1 && (
              <div className="text-center py-20 text-muted-foreground">
                <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium text-white mb-2">Trouvez votre prochain coup de cœur</p>
                <p>Recherchez parmi des milliers de films et séries.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
