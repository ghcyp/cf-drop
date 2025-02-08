import { createPromise } from "../utils/promise";

export const enum TableName {
  KV = 'kv',
  Files = 'files'
}

let dbPromise: Promise<IDBDatabase> | undefined;

export async function connect(force?: boolean) {
  if (dbPromise && !force) return dbPromise;
  return dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('cf-drop-kvdb', 2);
    let upgradePromise = Promise.resolve();
    request.onerror = (e) => {
      console.error('IndexedDB error', e);
      reject(e);
    };
    request.onupgradeneeded = (e) => {
      const db = (e as any).target.result as IDBDatabase;
      let transaction: undefined | IDBTransaction;

      upgradePromise = (async () => {
        switch (e.oldVersion) {
          case 0: {
            // since ver 1, create a "kv" table
            const store = db.createObjectStore(TableName.KV, { keyPath: 'key' });
            transaction = store.transaction
          }

          case 1: {
            // since ver 2, create a "files" table to store files to be uploaded
            const store = db.createObjectStore(TableName.Files, { keyPath: 'id', autoIncrement: true });
            transaction = store.transaction
          }
        }

        if (transaction) {
          const p = createPromise();
          transaction.oncomplete = p.resolve;
          transaction.onerror = p.reject;
          await p.promise;
        }
      })();
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result as IDBDatabase;
      upgradePromise.then(() => resolve(db));
    };
  });
}
