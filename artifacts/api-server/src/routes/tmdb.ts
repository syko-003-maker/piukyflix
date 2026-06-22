import { Router, type IRouter, type Request, type Response } from "express";
import { requireStaff } from "../middlewares/auth";

const router: IRouter = Router();
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

function getKey(res: Response): string | null {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    res.status(400).json({ error: "TMDB non configuré (TMDB_API_KEY manquante)." });
    return null;
  }
  return key;
}

// GET /tmdb/search?q=...&type=movie|series  -> normalized search results
router.get("/tmdb/search", async (req: Request, res: Response) => {
  if (!(await requireStaff(req, res))) return;
  const key = getKey(res);
  if (!key) return;

  const q = String(req.query.q ?? "").trim();
  const type = req.query.type === "series" ? "tv" : "movie";
  if (!q) {
    res.json([]);
    return;
  }

  try {
    const url = `${TMDB}/search/${type}?api_key=${key}&language=fr-FR&include_adult=false&query=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    if (!r.ok) {
      res.status(502).json({ error: "Erreur TMDB" });
      return;
    }
    const data = (await r.json()) as any;
    const results = (data.results ?? []).slice(0, 12).map((m: any) => {
      const date = type === "tv" ? m.first_air_date : m.release_date;
      return {
        id: m.id,
        title: type === "tv" ? m.name : m.title,
        year: date ? String(date).slice(0, 4) : null,
        posterUrl: m.poster_path ? `${IMG}/w342${m.poster_path}` : null,
        overview: m.overview || "",
      };
    });
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "TMDB search failed");
    res.status(502).json({ error: "Erreur TMDB" });
  }
});

// GET /tmdb/details?type=movie|series&id=123  -> normalized content payload
router.get("/tmdb/details", async (req: Request, res: Response) => {
  if (!(await requireStaff(req, res))) return;
  const key = getKey(res);
  if (!key) return;

  const type = req.query.type === "series" ? "tv" : "movie";
  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "id invalide" });
    return;
  }

  try {
    const r = await fetch(`${TMDB}/${type}/${id}?api_key=${key}&language=fr-FR&append_to_response=credits,videos,release_dates,content_ratings`);
    if (!r.ok) {
      res.status(502).json({ error: "Erreur TMDB" });
      return;
    }
    const m = (await r.json()) as any;
    const date = type === "tv" ? m.first_air_date : m.release_date;
    const runtime = type === "tv"
      ? (Array.isArray(m.episode_run_time) ? m.episode_run_time[0] : null)
      : m.runtime;

    const credits = m.credits ?? {};
    const cast = Array.isArray(credits.cast)
      ? (credits.cast.slice(0, 8).map((c: any) => c.name).filter(Boolean).join(", ") || null)
      : null;
    const director = type === "tv"
      ? (Array.isArray(m.created_by) && m.created_by[0] ? m.created_by[0].name : null)
      : (Array.isArray(credits.crew) ? (credits.crew.find((c: any) => c.job === "Director")?.name ?? null) : null);

    const videos = Array.isArray(m.videos?.results) ? m.videos.results : [];
    const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ?? videos.find((v: any) => v.site === "YouTube");
    const trailerUrl = trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

    const country = type === "tv"
      ? ((Array.isArray(m.origin_country) && m.origin_country[0]) || (Array.isArray(m.production_countries) && m.production_countries[0] ? m.production_countries[0].name : null) || null)
      : (Array.isArray(m.production_countries) && m.production_countries[0] ? m.production_countries[0].name : null);

    let maturityRating: string | null = null;
    if (type === "movie") {
      const rd = Array.isArray(m.release_dates?.results) ? m.release_dates.results : [];
      const pick = rd.find((x: any) => x.iso_3166_1 === "FR") ?? rd.find((x: any) => x.iso_3166_1 === "US");
      maturityRating = pick?.release_dates?.find((d: any) => d.certification)?.certification || null;
    } else {
      const cr = Array.isArray(m.content_ratings?.results) ? m.content_ratings.results : [];
      const pick = cr.find((x: any) => x.iso_3166_1 === "FR") ?? cr.find((x: any) => x.iso_3166_1 === "US");
      maturityRating = pick?.rating || null;
    }

    res.json({
      title: (type === "tv" ? m.name : m.title) || "",
      contentType: type === "tv" ? "series" : "movie",
      description: m.overview || null,
      releaseYear: date ? Number(String(date).slice(0, 4)) : null,
      durationMinutes: runtime ? Number(runtime) : null,
      posterUrl: m.poster_path ? `${IMG}/w500${m.poster_path}` : null,
      backdropUrl: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : null,
      genre: Array.isArray(m.genres) && m.genres[0] ? m.genres[0].name : null,
      tagline: m.tagline || null,
      originalLanguage: m.original_language || null,
      cast,
      director,
      trailerUrl,
      country,
      maturityRating,
      tmdbId: m.id ?? id,
    });
  } catch (err) {
    req.log.error({ err }, "TMDB details failed");
    res.status(502).json({ error: "Erreur TMDB" });
  }
});

export default router;
