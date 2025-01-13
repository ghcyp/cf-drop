// temporary store files in indexeddb until uploaded

import { atom } from 'jotai';
import { store } from '.';
import { kvGet, kvSet, KvKey } from './kvdb';
import { debounce } from '../utils/debounce';

export const inputTextAtom = atom('');
export const inputFilesAtom = atom<File[]>([]);

kvGet(KvKey.InputText, '').then((text) => store.set(inputTextAtom, text));
kvGet(KvKey.InputFiles, []).then((files: any[]) => store.set(inputFilesAtom, files.map(f => {
  const file = f.file;
  file.thumbnail = f.thumbnail;
  return file;
})));

store.sub(inputTextAtom, debounce(() => kvSet(KvKey.InputText, store.get(inputTextAtom)), 1000));
store.sub(inputFilesAtom, debounce(() => {
  const files = store.get(inputFilesAtom)
  kvSet(KvKey.InputFiles, files.map(file => ({ file, thumbnail: file.thumbnail })))
}, 500));
