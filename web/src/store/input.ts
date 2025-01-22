// temporary store files in indexeddb until uploaded

import { atom } from 'jotai';
import { store } from '.';
import KvStore from '../database/kv';
import FileStore, { FileStoreItem } from '../database/files';
import { createThumbnail } from '../utils/createThumbnail';

export const inputTextAtom = atom('');
export const inputFilesAtom = atom<FileStoreItem[]>([]);

KvStore.inputText.get().then((text) => {
  store.set(inputTextAtom, text)
  store.sub(inputTextAtom, () => KvStore.inputText.setDebounced(store.get(inputTextAtom)));
});

FileStore.list().then((files) => {
  store.set(inputFilesAtom, files);
})

export async function addFiles(files: File[]) {
  for (const file of files) {
    let thumbnail = '';
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      try {
        thumbnail = await createThumbnail(url);
      } catch (e) {
        // failed to create thumbnail
      }
      URL.revokeObjectURL(url);
    }

    const item = await FileStore.add({
      name: file.name,
      blob: file,
      thumbnail,
    });

    store.set(inputFilesAtom, (prev) => [...prev, item]);
  }
}

export async function removeFile(id: number) {
  await FileStore.delete(id);
  store.set(inputFilesAtom, (prev) => prev.filter((item) => item.id !== id));
}

export async function clearFiles() {
  await FileStore.clear();
  store.set(inputFilesAtom, []);
}
