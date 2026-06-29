import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { contentTable, seasonsTable, episodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

// POST /tmdb/import-series?id=123 -> create the series + all its seasons + episodes from TMDB
router.post("/tmdb/import-series", async (req: Request, res: Response) => {
  if (!(await requireStaff(req, res))) return;
  const key = getKey(res);
  if (!key) return;

  const id = Number(req.query.id ?? (req.body as any)?.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "id invalide" });
    return;
  }

  try {
    const existing = await db.select().from(contentTable).where(eq(contentTable.tmdbId, id)).limit(1);

    const r = await fetch(`${TMDB}/tv/${id}?api_key=${key}&language=fr-FR&append_to_response=credits,videos,content_ratings`);
    if (!r.ok) {
      res.status(502).json({ error: "Erreur TMDB" });
      return;
    }
    const m = (await r.json()) as any;

    // Create the series only if it doesn't exist yet; otherwise re-sync (add what's missing).
    let content: any = existing[0];
    const created = !content;
    if (!content) {
      const credits = m.credits ?? {};
      const cast = Array.isArray(credits.cast)
        ? (credits.cast.slice(0, 8).map((c: any) => c.name).filter(Boolean).join(", ") || null)
        : null;
      const director = Array.isArray(m.created_by) && m.created_by[0] ? m.created_by[0].name : null;
      const videos = Array.isArray(m.videos?.results) ? m.videos.results : [];
      const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ?? videos.find((v: any) => v.site === "YouTube");
      const trailerUrl = trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
      const country = (Array.isArray(m.origin_country) && m.origin_country[0]) ||
        (Array.isArray(m.production_countries) && m.production_countries[0] ? m.production_countries[0].name : null) || null;
      const cr = Array.isArray(m.content_ratings?.results) ? m.content_ratings.results : [];
      const crPick = cr.find((x: any) => x.iso_3166_1 === "FR") ?? cr.find((x: any) => x.iso_3166_1 === "US");
      const maturityRating = crPick?.rating || null;
      const date = m.first_air_date;

      const inserted = await db.insert(contentTable).values({
        title: m.name || "Sans titre",
        description: m.overview || null,
        posterUrl: m.poster_path ? `${IMG}/w500${m.poster_path}` : null,
        backdropUrl: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : null,
        genre: Array.isArray(m.genres) && m.genres[0] ? m.genres[0].name : null,
        releaseYear: date ? Number(String(date).slice(0, 4)) : null,
        durationMinutes: Array.isArray(m.episode_run_time) && m.episode_run_time[0] ? Number(m.episode_run_time[0]) : null,
        contentType: "series",
        maturityRating, cast, director,
        tagline: m.tagline || null,
        trailerUrl,
        originalLanguage: m.original_language || null,
        country,
        tmdbId: id,
      }).returning();
      content = inserted[0];
    }

    // Map existing seasons/episodes so a re-sync only ADDS what's missing (never overwrites user videos).
    const existingSeasons = await db.select().from(seasonsTable).where(eq(seasonsTable.contentId, content.id));
    const seasonByNumber = new Map<number, any>();
    existingSeasons.forEach((s) => seasonByNumber.set(s.seasonNumber, s));

    const seasonNumbers: number[] = (Array.isArray(m.seasons) ? m.seasons : [])
      .map((s: any) => Number(s.season_number))
      .filter((n: number) => Number.isFinite(n) && n >= 1)
      .sort((a: number, b: number) => a - b);

    let seasonsAdded = 0;
    let episodesAdded = 0;
    for (const sn of seasonNumbers) {
      const sr = await fetch(`${TMDB}/tv/${id}/season/${sn}?api_key=${key}&language=fr-FR`);
      if (!sr.ok) continue;
      const sd = (await sr.json()) as any;

      let season = seasonByNumber.get(sn);
      if (!season) {
        const insertedSeason = await db.insert(seasonsTable).values({
          contentId: content.id,
          seasonNumber: sn,
          title: sd.name || null,
          description: sd.overview || null,
        }).returning();
        season = insertedSeason[0];
        seasonByNumber.set(sn, season);
        seasonsAdded++;
      }

      const existingEps = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, season.id));
      const haveEpNums = new Set(existingEps.map((e) => e.episodeNumber));
      const newEps = (Array.isArray(sd.episodes) ? sd.episodes : [])
        .filter((e: any) => Number.isFinite(Number(e.episode_number)) && !haveEpNums.has(Number(e.episode_number)));
      if (newEps.length > 0) {
        await db.insert(episodesTable).values(newEps.map((e: any) => ({
          seasonId: season.id,
          episodeNumber: Number(e.episode_number),
          title: e.name || `Épisode ${e.episode_number}`,
          description: e.overview || null,
          videoUrl: null,
          thumbnailUrl: e.still_path ? `${IMG}/w300${e.still_path}` : null,
          durationMinutes: e.runtime ? Number(e.runtime) : null,
        })));
        episodesAdded += newEps.length;
      }
    }

    res.status(created ? 201 : 200).json({ contentId: content.id, title: content.title, created, seasonsAdded, episodesAdded });
  } catch (err) {
    req.log.error({ err }, "TMDB series import failed");
    res.status(502).json({ error: "Import TMDB échoué" });
  }
});

// POST /tmdb/sync-series  body { contentId, tmdbId } -> link an existing series to TMDB and fill gaps
// (poster/metadata, missing seasons/episodes, AND empty fields like thumbnails on existing episodes).
// Never overwrites a videoUrl or anything the admin already set.
router.post("/tmdb/sync-series", async (req: Request, res: Response) => {
  if (!(await requireStaff(req, res))) return;
  const key = getKey(res);
  if (!key) return;

  const contentId = Number((req.body as any)?.contentId);
  const tmdbId = Number((req.body as any)?.tmdbId);
  if (!Number.isFinite(contentId) || contentId <= 0 || !Number.isFinite(tmdbId) || tmdbId <= 0) {
    res.status(400).json({ error: "contentId/tmdbId invalides" });
    return;
  }

  try {
    const rows = await db.select().from(contentTable).where(eq(contentTable.id, contentId)).limit(1);
    const content = rows[0];
    if (!content) { res.status(404).json({ error: "Contenu introuvable" }); return; }

    const r = await fetch(`${TMDB}/tv/${tmdbId}?api_key=${key}&language=fr-FR&append_to_response=credits,videos,content_ratings`);
    if (!r.ok) { res.status(502).json({ error: "Erreur TMDB" }); return; }
    const m = (await r.json()) as any;

    const credits = m.credits ?? {};
    const cast = Array.isArray(credits.cast) ? (credits.cast.slice(0, 8).map((c: any) => c.name).filter(Boolean).join(", ") || null) : null;
    const director = Array.isArray(m.created_by) && m.created_by[0] ? m.created_by[0].name : null;
    const videos = Array.isArray(m.videos?.results) ? m.videos.results : [];
    const trailer = videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ?? videos.find((v: any) => v.site === "YouTube");
    const trailerUrl = trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    const country = (Array.isArray(m.origin_country) && m.origin_country[0]) || (Array.isArray(m.production_countries) && m.production_countries[0] ? m.production_countries[0].name : null) || null;
    const cr = Array.isArray(m.content_ratings?.results) ? m.content_ratings.results : [];
    const crPick = cr.find((x: any) => x.iso_3166_1 === "FR") ?? cr.find((x: any) => x.iso_3166_1 === "US");
    const maturityRating = crPick?.rating || null;

    const fill: Record<string, unknown> = { tmdbId };
    if (!content.posterUrl && m.poster_path) fill.posterUrl = `${IMG}/w500${m.poster_path}`;
    if (!content.backdropUrl && m.backdrop_path) fill.backdropUrl = `${IMG}/w1280${m.backdrop_path}`;
    if (!content.description && m.overview) fill.description = m.overview;
    if (!content.genre && Array.isArray(m.genres) && m.genres[0]) fill.genre = m.genres[0].name;
    if (!content.cast && cast) fill.cast = cast;
    if (!content.director && director) fill.director = director;
    if (!content.tagline && m.tagline) fill.tagline = m.tagline;
    if (!content.trailerUrl && trailerUrl) fill.trailerUrl = trailerUrl;
    if (!content.originalLanguage && m.original_language) fill.originalLanguage = m.original_language;
    if (!content.country && country) fill.country = country;
    if (!content.maturityRating && maturityRating) fill.maturityRating = maturityRating;
    await db.update(contentTable).set(fill).where(eq(contentTable.id, contentId));

    const existingSeasons = await db.select().from(seasonsTable).where(eq(seasonsTable.contentId, contentId));
    const seasonByNumber = new Map<number, any>();
    existingSeasons.forEach((s) => seasonByNumber.set(s.seasonNumber, s));

    const seasonNumbers: number[] = (Array.isArray(m.seasons) ? m.seasons : [])
      .map((s: any) => Number(s.season_number)).filter((n: number) => Number.isFinite(n) && n >= 1).sort((a: number, b: number) => a - b);

    let seasonsAdded = 0, episodesAdded = 0, episodesUpdated = 0;
    for (const sn of seasonNumbers) {
      const sr = await fetch(`${TMDB}/tv/${tmdbId}/season/${sn}?api_key=${key}&language=fr-FR`);
      if (!sr.ok) continue;
      const sd = (await sr.json()) as any;

      let season = seasonByNumber.get(sn);
      if (!season) {
        const inserted = await db.insert(seasonsTable).values({ contentId, seasonNumber: sn, title: sd.name || null, description: sd.overview || null }).returning();
        season = inserted[0];
        seasonByNumber.set(sn, season);
        seasonsAdded++;
      }

      const existingEps = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, season.id));
      const epByNum = new Map<number, any>();
      existingEps.forEach((e) => epByNum.set(e.episodeNumber, e));

      const tmdbEps = (Array.isArray(sd.episodes) ? sd.episodes : []).filter((e: any) => Number.isFinite(Number(e.episode_number)));
      const toInsert: any[] = [];
      for (const e of tmdbEps) {
        const num = Number(e.episode_number);
        const thumb = e.still_path ? `${IMG}/w300${e.still_path}` : null;
        const ex = epByNum.get(num);
        if (!ex) {
          toInsert.push({ seasonId: season.id, episodeNumber: num, title: e.name || `Épisode ${num}`, description: e.overview || null, videoUrl: null, thumbnailUrl: thumb, durationMinutes: e.runtime ? Number(e.runtime) : null });
        } else {
          const upd: Record<string, unknown> = {};
          if (!ex.thumbnailUrl && thumb) upd.thumbnailUrl = thumb;
          if (!ex.description && e.overview) upd.description = e.overview;
          if (ex.durationMinutes == null && e.runtime) upd.durationMinutes = Number(e.runtime);
          if (Object.keys(upd).length > 0) {
            await db.update(episodesTable).set(upd).where(eq(episodesTable.id, ex.id));
            episodesUpdated++;
          }
        }
      }
      if (toInsert.length > 0) { await db.insert(episodesTable).values(toInsert); episodesAdded += toInsert.length; }
    }

    res.json({ seasonsAdded, episodesAdded, episodesUpdated });
  } catch (err) {
    req.log.error({ err }, "TMDB series sync failed");
    res.status(502).json({ error: "Synchronisation TMDB échouée" });
  }
});

export default router;
