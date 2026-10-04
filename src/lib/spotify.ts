export interface NowPlaying {
  playing: boolean;
  title: string;
  artist: string;
  url: string;
}

async function accessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token request responded ${response.status}`);
  }

  const json: any = await response.json();
  return json.access_token;
}

function toNowPlaying(track: any, playing: boolean): NowPlaying {
  return {
    playing,
    title: track.name,
    artist: track.artists.map((artist: any) => artist.name).join(', '),
    url: track.external_urls.spotify,
  };
}

export async function fetchNowPlaying(clientId: string, clientSecret: string, refreshToken: string): Promise<NowPlaying | null> {
  const token = await accessToken(clientId, clientSecret, refreshToken);
  const headers = { Authorization: `Bearer ${token}` };

  const current = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers });
  if (current.status === 200) {
    const json: any = await current.json();
    if (json.is_playing && json.item?.type === 'track') {
      return toNowPlaying(json.item, true);
    }
  }

  const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers });
  if (!recent.ok) {
    throw new Error(`Spotify recently-played responded ${recent.status}`);
  }

  const json: any = await recent.json();
  const track = json.items?.[0]?.track;
  return track ? toNowPlaying(track, false) : null;
}
