import { atom } from 'jotai';
import { store } from './store';

const passwordLocalKey = 'cf-drop-password';
const passwordStrAtom = atom(localStorage.getItem(passwordLocalKey) || '');

export const $password = atom(
  (get) => get(passwordStrAtom),
  (_, set, newValue: string) => {
    localStorage.setItem(passwordLocalKey, newValue);
    set(passwordStrAtom, newValue);
  },
);

export const $passwordInvalid = atom(false);

export function fetchAPI(input: RequestInfo | URL, init?: RequestInit) {
  const password = store.get($password);
  if (password) {
    init = {
      ...init,
      headers: {
        ...init?.headers,
        'x-password': password,
      },
    };
  }

  return fetch(input, init).then((res) => {
    if (res.status === 401) {
      store.set($passwordInvalid, true);
      throw new Error('Password required');
    }

    store.set($passwordInvalid, false);
    return res;
  });
}
