import { Workbox } from 'workbox-window';

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');
  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      const toast = document.createElement('div');
      toast.className = 'bg-brand-6 text-white text-sm p-2 fixed top-0 left-0 right-0 z-50 animate-slide-in-down animate-duration-200';
      toast.innerText = 'New version available. click to refresh';
      document.body.appendChild(toast);
      toast.addEventListener('click', () => {
        window.location.reload();
      });
    }
  });
  wb.register();
}
