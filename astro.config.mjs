import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { loadEnv } from 'vite';

const devApi = {
  name: 'dev-api',
  configureServer(server) {
    const env = loadEnv('development', process.cwd(), '');

    const route = (path, handler) => {
      server.middlewares.use(path, async (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          res.end(JSON.stringify(await handler()));
        } catch (error) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    };

    route('/api/contributions', async () => {
      const { fetchContributions } = await server.ssrLoadModule('/src/lib/contributions.ts');
      return fetchContributions(env.GITHUB_TOKEN);
    });

    route('/api/now-playing', async () => {
      const { fetchNowPlaying } = await server.ssrLoadModule('/src/lib/spotify.ts');
      return fetchNowPlaying(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET, env.SPOTIFY_REFRESH_TOKEN);
    });
  },
};

export default defineConfig({
  site: 'https://taanishr.com',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
  vite: {
    plugins: [devApi],
  },
});
