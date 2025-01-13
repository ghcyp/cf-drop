import { atom } from 'jotai';
import { store } from '.';
import { kvGet, KvKey, kvSet } from './kvdb';

export const passwordAtom = atom('');
export const passwordInvalidAtom = atom(false);

const passwordInitPromise = kvGet(KvKey.Password, '').then((password) => {
  store.set(passwordAtom, password);
  store.sub(passwordAtom, () => { kvSet(KvKey.Password, store.get(passwordAtom)); })
  return password;
});

export async function fetchAPI(input: RequestInfo | URL, init?: RequestInit) {
  await passwordInitPromise;
  const password = store.get(passwordAtom);
  if (password) {
    init = {
      ...init,
      headers: {
        ...init?.headers,
        'x-password': password,
      },
    };
  }

  const res = await fetch(input, init);
  if (res.status === 401) {
    store.set(passwordInvalidAtom, true);
    throw new Error('Password required');
  }

  store.set(passwordInvalidAtom, false);
  return res;
}
