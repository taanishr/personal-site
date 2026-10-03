import { fetchContributions } from '../../src/lib/contributions';

interface Env {
  GITHUB_TOKEN: string;
}

const CACHE_SECONDS = 3600;

export const onRequestGet = async (context: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }) => {
  const { request, env, waitUntil } = context;
  const cache = (caches as unknown as { default: Cache }).default;

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const data = await fetchContributions(env.GITHUB_TOKEN);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      },
    });
    waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
