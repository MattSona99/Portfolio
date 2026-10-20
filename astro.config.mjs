// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  devToolbar: { enabled: false },
  redirects: { '/': '/home' },
  vite: { plugins: [tailwindcss()]},
  integrations: [mdx()]
});