import { Link } from "wouter";
import { Play, Film, Tv, Star } from "lucide-react";

/** Premium poster card with rich hover (zoom, gradient, badges, play CTA). */
export function ContentCard({ item }: { item: any }) {
  return (
    <Link href={`/content/${item.id}`}>
      <div className="group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl bg-secondary shadow-md shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 hover:ring-2 hover:ring-primary/70">
        {item.posterUrl ? (
          <>
            {/* blurred fill so the full poster shows with no crop and no black bars */}
            <img src={item.posterUrl} aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl" />
            <img
              src={item.posterUrl}
              alt={item.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
            {item.contentType === "movie" ? <Film className="h-8 w-8 text-muted-foreground" /> : <Tv className="h-8 w-8 text-muted-foreground" />}
            <span className="text-sm font-bold text-white">{item.title}</span>
          </div>
        )}

        {item.maturityRating && (
          <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {item.maturityRating}
          </span>
        )}

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <Play className="h-3 w-3 fill-current" /> Voir
            </span>
            {item.averageRating != null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                <Star className="h-3 w-3 fill-current" /> {Number(item.averageRating).toFixed(1)}
              </span>
            )}
          </div>
          <h3 className="truncate text-sm font-bold text-white">{item.title}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-300">
            {item.releaseYear && <span>{item.releaseYear}</span>}
            <span className="rounded border border-white/20 px-1">{item.contentType === "movie" ? "Film" : "Série"}</span>
            {item.genre && <span className="truncate">{item.genre}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
