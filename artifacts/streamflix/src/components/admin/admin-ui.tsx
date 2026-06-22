import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared admin UI effects: 3D tilt cards, count-up numbers, reveal-on-mount.
 * Built on framer-motion (already a dependency). No new packages.
 */

/** Card that tilts in 3D toward the cursor. */
export function TiltCard({
  children,
  className,
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * intensity, ry: px * intensity });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      style={{ transformStyle: "preserve-3d", transformPerspective: 900 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/** Fade + slide in when scrolled into view (once). */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Animated number that counts up to `value`. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{display.toLocaleString("fr-FR")}</span>;
}

const ACCENTS: Record<string, string> = {
  red: "from-primary/25 text-primary",
  blue: "from-blue-500/25 text-blue-400",
  green: "from-green-500/25 text-green-400",
  yellow: "from-yellow-500/25 text-yellow-400",
  purple: "from-purple-500/25 text-purple-400",
  pink: "from-pink-500/25 text-pink-400",
};

/** KPI card with 3D tilt, glow accent and count-up value. */
export function StatCard({
  title,
  value,
  icon,
  accent = "red",
  delay = 0,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  accent?: keyof typeof ACCENTS | string;
  delay?: number;
}) {
  const accentClass = ACCENTS[accent] ?? ACCENTS.red;
  return (
    <Reveal delay={delay}>
      <TiltCard className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card p-6">
        <div
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
            accentClass.split(" ")[0],
          )}
        />
        <div className="relative flex items-center gap-4">
          <div className={cn("rounded-xl border border-white/10 bg-secondary/60 p-3", accentClass.split(" ")[1])}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <CountUp value={value} className="text-3xl font-bold text-white" />
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}
