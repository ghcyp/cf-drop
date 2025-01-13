let dbPromise: Promise<IDBDatabase> | undefined

const tableName = 'kv';

export enum KvKey {
  Password = 'password',
  InputText = 'input-text',
  InputFiles = 'input-files',
}

async function connect(force?: boolean) {
  if (dbPromise && !force) return dbPromise;
  return dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('cf-drop-kvdb', 1);
    let upgradePromise = Promise.resolve();
    request.onerror = (e) => {
      console.error('kvdb error', e);
      reject(e);
    };
    request.onupgradeneeded = (e) => {
      const db = (e as any).target.result as IDBDatabase;
      upgradePromise = new Promise((resolve, reject) => {
        const store = db.createObjectStore(tableName, { keyPath: 'key' })
        store.transaction.oncomplete = () => resolve();
        store.transaction.onabort = reject;
        store.transaction.onerror = reject;
      });
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result as IDBDatabase;
      upgradePromise.then(() => resolve(db));
    };
  })
}

export async function kvGet<T>(key: string, defaultValue: T): Promise<T> {
  const db = await connect();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readonly');
    const store = transaction.objectStore(tableName);
    const request = store.get(key);
    request.onerror = (e) => {
      console.error('kvdb get error', e);
      reject(e);
    };
    request.onsuccess = () => {
      let val = request.result?.value;
      resolve(val === undefined ? defaultValue : val);
    };
  });
}

export async function kvSet<T>(key: string, value: T) {
  const db = await connect();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readwrite');
    const store = transaction.objectStore(tableName);
    const request = store.put({ key, value });
    request.onerror = (e) => {
      console.error('kvdb set error', e);
      reject(e);
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}
