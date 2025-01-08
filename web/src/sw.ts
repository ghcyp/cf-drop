import { registerRoute } from 'workbox-routing';
import { precacheAndRoute } from 'workbox-precaching';

declare global {
  var __WB_MANIFEST: any;
}

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  '/api/post',
  async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';
    const files = formData.getAll('files') || [];

    console.log('recv', { title, text, url, files });

    const resp = new Response('hello world for ' + request.url);
    return resp;
  },
  'POST',
);
