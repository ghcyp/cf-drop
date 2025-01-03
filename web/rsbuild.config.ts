import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack';
import { unoConfig } from './uno.config';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    rspack(config, ctx) {
      ctx.prependPlugins(UnoCSSRspackPlugin({ ...unoConfig }));
      config.optimization ??= {};
      config.optimization.realContentHash = true;
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
