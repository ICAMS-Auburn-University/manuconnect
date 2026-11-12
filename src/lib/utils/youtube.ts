const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns the 11-char video id from watch, youtu.be, embed, live and shorts URLs. */
export function parseYouTubeId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      candidate = url.searchParams.get('v');
    } else {
      const [kind, id] = url.pathname.split('/').filter(Boolean);
      if (kind === 'embed' || kind === 'live' || kind === 'shorts') {
        candidate = id ?? null;
      }
    }
  }

  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}
