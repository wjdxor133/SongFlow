export type SpotifyAlbum = {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  release_date: string;
  total_tracks: number;
  images: { url: string }[];
};

export type SpotifyAudioFeatures = {
  tempo: number;
  key: number;
  mode: number;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error (${res.status}): ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function searchSpotifyAlbum(
  token: string,
  artist: string,
  albumName: string
): Promise<SpotifyAlbum[]> {
  const q = encodeURIComponent(`album:${albumName} artist:${artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?type=album&q=${q}&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify search error (${res.status})`);
  const data = await res.json() as { albums: { items: SpotifyAlbum[] } };
  return data.albums.items;
}

export async function getSpotifyAlbumTracks(
  token: string,
  albumId: string
): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify tracks error (${res.status})`);
  const data = await res.json() as { items: SpotifyTrack[] };
  return data.items;
}

const KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function formatSpotifyKey(key: number, mode: number): string {
  if (key === -1) return "";
  return `${KEY_NAMES[key]} ${mode === 1 ? "major" : "minor"}`;
}

export async function getAudioFeaturesBatch(
  token: string,
  trackIds: string[]
): Promise<Map<string, SpotifyAudioFeatures>> {
  const ids = trackIds.join(",");
  const res = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${ids}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Spotify audio-features error (${res.status})`);
  const data = await res.json() as { audio_features: (SpotifyAudioFeatures & { id: string } | null)[] };

  const map = new Map<string, SpotifyAudioFeatures>();
  for (const f of data.audio_features) {
    if (f) map.set(f.id, { tempo: f.tempo, key: f.key, mode: f.mode });
  }
  return map;
}

export async function getArtistGenres(
  token: string,
  artistId: string
): Promise<string[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return [];
  const data = await res.json() as { genres: string[] };
  return data.genres;
}
