import { createPromise } from "../utils/promise";
import { connect, TableName } from "./connect";

export interface FileStoreItem {
  id: number;
  name: string;
  blob: Blob;
  thumbnail: string;
  ctime: number;
}

async function listFiles() {
  const db = await connect();
  const transaction = db.transaction(TableName.Files, 'readonly');
  const store = transaction.objectStore(TableName.Files);
  const request = store.getAll();

  const p = createPromise();
  request.onerror = p.reject;
  request.onsuccess = p.resolve;
  await p.promise;

  return request.result as FileStoreItem[];
}

async function addFile(info: { name: string, blob: Blob, thumbnail?: string }): Promise<FileStoreItem> {
  const item: Omit<FileStoreItem, 'id'> = {
    name: info.name,
    blob: info.blob,
    thumbnail: info.thumbnail || '',
    ctime: Date.now(),
  };

  const db = await connect();
  const transaction = db.transaction(TableName.Files, 'readwrite');
  const store = transaction.objectStore(TableName.Files);
  const request = store.add(item);

  const p = createPromise();
  request.onerror = p.reject;
  request.onsuccess = p.resolve;
  await p.promise;

  return {
    id: request.result as number,
    ...item,
  };
}

async function updateFile(id: number, info: Partial<FileStoreItem>) {
  const db = await connect();
  const transaction = db.transaction(TableName.Files, 'readwrite');
  const store = transaction.objectStore(TableName.Files);
  const request = store.get(id);

  const p = createPromise();
  request.onerror = p.reject;
  request.onsuccess = p.resolve;
  await p.promise;

  const item = request.result as FileStoreItem;
  if (!item) {
    throw new Error(`File not found: ${id}`);
  }

  const updateRequest = store.put({ ...item, ...info }, id);

  const p2 = createPromise();
  updateRequest.onerror = p2.reject;
  updateRequest.onsuccess = p2.resolve;
  await p2.promise;
}

async function deleteFile(id: number) {
  const db = await connect();
  const transaction = db.transaction(TableName.Files, 'readwrite');
  const store = transaction.objectStore(TableName.Files);
  const request = store.delete(id);

  const p = createPromise();
  request.onerror = p.reject;
  request.onsuccess = p.resolve;
  await p.promise;
}

async function clearFiles() {
  const db = await connect();
  const transaction = db.transaction(TableName.Files, 'readwrite');
  const store = transaction.objectStore(TableName.Files);
  const request = store.clear();

  const p = createPromise();
  request.onerror = p.reject;
  request.onsuccess = p.resolve;
  await p.promise;
}

const FileStore = {
  list: listFiles,
  add: addFile,
  update: updateFile,
  delete: deleteFile,
  clear: clearFiles,
};

export default FileStore;
