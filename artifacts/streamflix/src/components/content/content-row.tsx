import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./content-card";

/** Netflix-style horizontal carousel of poster cards with hover arrows. */
export function ContentRow({ title, items }: { title: string; items: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items || items.length === 0) return null;

  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="group/row relative">
      <h2 className="mb-3 text-xl font-bold text-white md:text-2xl">{title}</h2>
      <div className="relative">
        <button
          type="button"
          aria-label="Précédent"
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-0 z-20 hidden h-full w-12 items-center justify-start rounded-l-xl bg-gradient-to-r from-background/95 to-transparent text-white opacity-0 transition-opacity hover:text-primary group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="h-9 w-9" />
        </button>

        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div key={item.id} className="w-32 flex-none sm:w-36 md:w-44">
              <ContentCard item={item} />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Suivant"
          onClick={() => scroll(1)}
          className="absolute -right-3 top-0 z-20 hidden h-full w-12 items-center justify-end rounded-r-xl bg-gradient-to-l from-background/95 to-transparent text-white opacity-0 transition-opacity hover:text-primary group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="h-9 w-9" />
        </button>
      </div>
    </section>
  );
}
