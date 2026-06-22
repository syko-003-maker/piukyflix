export interface TmdbResult {
  id: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
  overview: string;
}

export interface TmdbContent {
  title: string;
  contentType: "movie" | "series";
  description: string | null;
  releaseYear: number | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genre: string | null;
}

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error || "Erreur TMDB";
}

export async function searchTmdb(query: string, type: "movie" | "series"): Promise<TmdbResult[]> {
  const res = await fetch(`/api/tmdb/search?type=${type}&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function tmdbDetails(type: "movie" | "series", id: number): Promise<TmdbContent> {
  const res = await fetch(`/api/tmdb/details?type=${type}&id=${id}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
