/**
 * If `url` is a Google Drive share link, return its embeddable preview URL
 * (played via Google's iframe player); otherwise return null.
 *
 * Handles the common Drive URL shapes:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 */
export function getDriveEmbedUrl(url: string): string | null {
  if (!url || !url.includes("drive.google.com")) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
}
