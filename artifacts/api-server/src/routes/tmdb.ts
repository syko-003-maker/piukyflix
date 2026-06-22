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
    const r = await fetch(`${TMDB}/${type}/${id}?api_key=${key}&language=fr-FR`);
    if (!r.ok) {
      res.status(502).json({ error: "Erreur TMDB" });
      return;
    }
    const m = (await r.json()) as any;
    const date = type === "tv" ? m.first_air_date : m.release_date;
    const runtime = type === "tv"
      ? (Array.isArray(m.episode_run_time) ? m.episode_run_time[0] : null)
      : m.runtime;
    res.json({
      title: (type === "tv" ? m.name : m.title) || "",
      contentType: type === "tv" ? "series" : "movie",
      description: m.overview || null,
      releaseYear: date ? Number(String(date).slice(0, 4)) : null,
      durationMinutes: runtime ? Number(runtime) : null,
      posterUrl: m.poster_path ? `${IMG}/w500${m.poster_path}` : null,
      backdropUrl: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : null,
      genre: Array.isArray(m.genres) && m.genres[0] ? m.genres[0].name : null,
    });
  } catch (err) {
    req.log.error({ err }, "TMDB details failed");
    res.status(502).json({ error: "Erreur TMDB" });
  }
});

export default router;
