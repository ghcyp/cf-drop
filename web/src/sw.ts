import { registerRoute } from 'workbox-routing';
import { precacheAndRoute } from 'workbox-precaching';
import KvStore from './database/kv';
import FileStore from './database/files';

declare var self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

precacheAndRoute(self.__WB_MANIFEST);
addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

registerRoute(
  '/api/post',
  async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';
    const files = formData.getAll('files') || [];

    console.log('recv', { title, text, url, files });

    // write message to indexedDB
    const newMessage = [
      await KvStore.inputText.get(),
      title,
      text,
      url,
    ].filter(Boolean).join('\n\n');
    await KvStore.inputText.set(newMessage);

    // add files to indexedDB
    for (const file of files) {
      if (!(file instanceof File)) continue;
      await FileStore.add({
        name: file.name,
        blob: file,
        // URL.createObjectURL is not supported in service worker
        // so we can't create thumbnail
      });
    }

    const resp = new Response('Redirecting to /', {
      status: 302,
      headers: {
        location: '/',
      },
    });
    return resp;
  },
  'POST',
);
