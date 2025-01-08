import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { configRsPack } from './rspack.config';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  html: {
    template: './template.html',
    title: 'cf-drop',
    templateParameters: {
      publicPath: '/',
    },
  },
  plugins: [pluginSass(), pluginReact()],
  tools: {
    rspack: configRsPack,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
