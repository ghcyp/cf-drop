import { presetIcons } from '@unocss/preset-icons';
import { presetUno } from '@unocss/preset-uno';
import type { UserConfig } from '@unocss/core';
import MDIIcons from '@iconify-json/mdi/icons.json' assert { type: 'json' };

const unoConfig: UserConfig = {
  shortcuts: {
    'center-child': 'flex justify-center items-center',
    'col-center': 'flex flex-col justify-center items-center',
    'row-center': 'flex flex-row justify-center items-center',
  },
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
        // ...
      },
      collections: {
        mdi: () => MDIIcons,
      },
    }),
  ],
};

export default unoConfig;
