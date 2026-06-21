/**
 * Seed the catalog with demo content (categories, movies, one series).
 *
 * Idempotent: if the `content` table already has rows, it does nothing.
 * Uses publicly playable sample videos (Blender open movies + Google sample
 * bucket) and Picsum placeholder images, so the demo works out of the box.
 *
 * Run: pnpm --filter @workspace/scripts run seed   (needs DATABASE_URL)
 */

import { db, pool, categoriesTable, contentTable, seasonsTable, episodesTable } from "@workspace/db";

const VIDEO_BASE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
const poster = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`;
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}/1280/720`;

const MOVIES = [
  { title: "Big Buck Bunny", description: "Un lapin géant au grand cœur prend sa revanche sur trois rongeurs farceurs.", genre: "Animation", category: "Animation", releaseYear: 2008, durationMinutes: 10, file: "BigBuckBunny.mp4", featured: true, seed: "bunny" },
  { title: "Elephant's Dream", description: "Deux personnages explorent une étrange machine aux rouages infinis.", genre: "Science-Fiction", category: "Science-Fiction", releaseYear: 2006, durationMinutes: 11, file: "ElephantsDream.mp4", featured: false, seed: "elephant" },
  { title: "Sintel", description: "Une jeune femme part à la recherche du dragon qu'elle a recueilli.", genre: "Fantastique", category: "Action", releaseYear: 2010, durationMinutes: 15, file: "Sintel.mp4", featured: true, seed: "sintel" },
  { title: "Tears of Steel", description: "Dans un Amsterdam futuriste, un groupe tente de sauver le monde des robots.", genre: "Science-Fiction", category: "Science-Fiction", releaseYear: 2012, durationMinutes: 12, file: "TearsOfSteel.mp4", featured: false, seed: "steel" },
  { title: "For Bigger Blazes", description: "Court métrage de démonstration plein d'action.", genre: "Documentaire", category: "Documentaire", releaseYear: 2013, durationMinutes: 5, file: "ForBiggerBlazes.mp4", featured: false, seed: "blazes" },
  { title: "For Bigger Fun", description: "Une parenthèse légère et amusante.", genre: "Comédie", category: "Comédie", releaseYear: 2013, durationMinutes: 5, file: "ForBiggerFun.mp4", featured: false, seed: "fun" },
];

async function main() {
  const existing = await db.select({ id: contentTable.id }).from(contentTable).limit(1);
  if (existing.length > 0) {
    console.log("⏭️  Le catalogue contient déjà du contenu — seed ignoré.");
    console.log("    (Videz la table 'content' pour re-seeder.)");
    return;
  }

  console.log("🌱 Insertion des catégories…");
  const categoryNames = ["Action", "Comédie", "Science-Fiction", "Drame", "Documentaire", "Animation"];
  await db.insert(categoriesTable).values(categoryNames.map((name) => ({ name }))).onConflictDoNothing();
  const cats = await db.select().from(categoriesTable);
  const catId = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

  console.log("🎬 Insertion des films…");
  await db.insert(contentTable).values(
    MOVIES.map((m) => ({
      title: m.title,
      description: m.description,
      genre: m.genre,
      categoryId: catId(m.category),
      releaseYear: m.releaseYear,
      durationMinutes: m.durationMinutes,
      posterUrl: poster(m.seed),
      backdropUrl: backdrop(m.seed),
      videoUrl: VIDEO_BASE + m.file,
      contentType: "movie" as const,
      isFeatured: m.featured,
    })),
  );

  console.log("📺 Insertion d'une série avec épisodes…");
  const [series] = await db
    .insert(contentTable)
    .values({
      title: "Chroniques de Démo",
      description: "Une série de démonstration pour tester la lecture épisode par épisode.",
      genre: "Aventure",
      categoryId: catId("Action"),
      releaseYear: 2024,
      posterUrl: poster("chronicles"),
      backdropUrl: backdrop("chronicles"),
      contentType: "series" as const,
      isFeatured: true,
    })
    .returning();

  const [season1] = await db
    .insert(seasonsTable)
    .values({ contentId: series.id, seasonNumber: 1, title: "Saison 1" })
    .returning();

  await db.insert(episodesTable).values([
    { seasonId: season1.id, episodeNumber: 1, title: "Le commencement", description: "Tout commence ici.", videoUrl: VIDEO_BASE + "ForBiggerBlazes.mp4", thumbnailUrl: backdrop("ep1"), durationMinutes: 5 },
    { seasonId: season1.id, episodeNumber: 2, title: "L'évasion", description: "La fuite s'organise.", videoUrl: VIDEO_BASE + "ForBiggerEscapes.mp4", thumbnailUrl: backdrop("ep2"), durationMinutes: 5 },
    { seasonId: season1.id, episodeNumber: 3, title: "Le grand saut", description: "Le dénouement.", videoUrl: VIDEO_BASE + "ForBiggerJoyrides.mp4", thumbnailUrl: backdrop("ep3"), durationMinutes: 5 },
  ]);

  console.log("✅ Seed terminé : 6 catégories, 6 films, 1 série (3 épisodes).");
}

main()
  .catch((err) => {
    console.error("❌ Seed échoué:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
