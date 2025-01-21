import type { ModifyRspackConfigFn } from '@rsbuild/core';
import { InjectManifest } from '@aaroon/workbox-rspack-plugin';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack';
import unoConfig from './uno.config';

export const configRsPack: ModifyRspackConfigFn = (config, ctx) => {
  config.experiments ??= {};
  config.experiments.css = true;

  ctx.prependPlugins([
    new InjectManifest({
      swSrc: './src/sw.ts',
      swDest: 'sw.js',
      exclude: [/\.map$/, /\.txt$/],
    }),
    UnoCSSRspackPlugin({ ...unoConfig }),
  ]);

  config.optimization ??= {};
  config.optimization.realContentHash = true;
};
