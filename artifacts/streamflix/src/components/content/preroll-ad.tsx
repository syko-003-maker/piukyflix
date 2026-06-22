import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";

/** House pre-roll ad shown before playback for non-VIP users. Calls onComplete when the ad finishes or is skipped. */
export function PrerollAd({ ad, onComplete }: { ad: any; onComplete: () => void }) {
  const skipAfter = Math.max(0, Number(ad?.durationSeconds ?? 5));
  const [remaining, setRemaining] = useState(skipAfter);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
      {ad?.type === "image" ? (
        <img src={ad.url} alt={ad.title || "Publicité"} className="h-full w-full object-contain" />
      ) : (
        <video src={ad?.url} autoPlay className="h-full w-full object-contain" onEnded={onComplete} />
      )}

      <span className="absolute left-4 top-4 rounded bg-black/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        Publicité{ad?.title ? ` · ${ad.title}` : ""}
      </span>

      <p className="absolute bottom-6 left-6 max-w-xs text-xs text-gray-400">
        Passez <span className="font-semibold text-yellow-400">VIP</span> pour supprimer les pubs.
      </p>

      <div className="absolute bottom-6 right-6">
        {remaining > 0 ? (
          <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white">Passer dans {remaining}s</span>
        ) : (
          <Button onClick={onComplete} className="bg-white font-bold text-black hover:bg-white/85">
            Passer la pub <SkipForward className="ml-2 h-4 w-4 fill-current" />
          </Button>
        )}
      </div>
    </div>
  );
}
