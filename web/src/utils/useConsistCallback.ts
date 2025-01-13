import { useRef } from 'react';

export function useConsistCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;

  const consistFn = useRef((...args: any) => ref.current(...args));
  return consistFn.current as T;
}
