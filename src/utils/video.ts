export type ParsedVideoSource =
  | { kind: 'youtube'; embedUrl: string; videoId: string }
  | { kind: 'file'; src: string };

/**
 * Extracts a YouTube video ID from watch, youtu.be, shorts, or embed URLs,
 * or falls back to a direct video file path/URL.
 */
export function parseVideoSource(rawUrl: string): ParsedVideoSource {
  const trimmed = rawUrl.trim();
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      kind: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    };
  }

  return {
    kind: 'file',
    src: trimmed,
  };
}
