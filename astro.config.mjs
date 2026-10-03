import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { loadEnv } from 'vite';

const contributionsDevApi = {
  name: 'contributions-dev-api',
  configureServer(server) {
    const env = loadEnv('development', process.cwd(), '');
    server.middlewares.use('/api/contributions', async (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { fetchContributions } = await server.ssrLoadModule('/src/lib/contributions.ts');
        const data = await fetchContributions(env.GITHUB_TOKEN);
        res.end(JSON.stringify(data));
      } catch (error) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
  },
};

export default defineConfig({
  site: 'https://example.pages.dev',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
  vite: {
    plugins: [contributionsDevApi],
  },
});
