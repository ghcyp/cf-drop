export async function migrateTables(db: D1Database) {
  await db.exec(
    `
    CREATE TABLE IF NOT EXISTS upload_record (
      id INTEGER PRIMARY KEY,
      uploader TEXT NOT NULL,
      ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      size INTEGER DEFAULT 0,
      thumbnail TEXT NULL,
      files TEXT DEFAULT '',
      message TEXT DEFAULT ''
    )
  `.replace(/\n/g, "")
  );
}

export interface UploadRecord {
  id: number;
  uploader: string;
  ctime: Date;
  size: number;
  thumbnail: string | null;
  files: string; // JSON string of [{ name, size, path }]
  message: string;
}

/**
 * get latest 20 records. in descending order (newest first)
 *
 * to fetch older records, pass `beforeId` option (which is last id of prev page)
 */
export async function getUploadRecords(
  db: D1Database,
  opts: { beforeId?: number } = {}
) {
  const records: UploadRecord[] = [];

  let sql = "SELECT * FROM upload_record";
  if (opts.beforeId && Number.isInteger(opts.beforeId)) {
    sql += ` WHERE id < ${opts.beforeId}`;
  }
  sql += " ORDER BY id DESC LIMIT 20";

  const rows = await db.prepare(sql).all();
  for (const row of rows.results as any[]) {
    records.push({
      id: row.id,
      uploader: row.uploader,
      ctime: new Date(row.ctime),
      size: row.size,
      thumbnail: row.thumbnail,
      files: row.files,
      message: row.message,
    });
  }
  return records;
}

export async function createUploadRecord(
  db: D1Database,
  record: Omit<UploadRecord, "id" | "ctime">
) {
  const res = await db
    .prepare(
      "INSERT INTO upload_record (uploader, size, thumbnail, files, message) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      record.uploader,
      record.size,
      record.thumbnail,
      record.files,
      record.message
    )
    .run();
  const id = res.meta.last_row_id;
  const inserted: UploadRecord = {
    ...record,
    ctime: new Date(),
    id,
  };
  return { id, inserted };
}

export async function purgeRecordsBeforeId(
  db: D1Database,
  beforeId: number,
  deleteFiles: (path: string[]) => Promise<void>
) {
  // 1. fetch all ids and file
  const rows = await db
    .prepare("SELECT id, files FROM upload_record WHERE id < ?")
    .bind(beforeId)
    .all<UploadRecord>();
  const ids = rows.results.map((row) => row.id);

  // 2. delete files
  for (const row of rows.results) {
    if (!row.files) continue;
    try {
      const files = JSON.parse(row.files) as {
        name: string;
        path: string;
        size: number;
      }[];
      await deleteFiles(files.map((file) => file.path));
    } catch {}
  }

  // 3. delete records
  await db.prepare(`DELETE FROM upload_record WHERE id IN (${ids})`).run();

  return;
}

export async function deleteRecord(
  db: D1Database,
  id: number,
  deleteFiles: (path: string[]) => Promise<void>
) {
  // 1. get record
  const record = await db
    .prepare(`SELECT * FROM upload_record WHERE id = ?`)
    .bind(id)
    .first<UploadRecord>();
  if (!record) return;

  // 2. delete files
  if (!record.files) return;
  try {
    const files = JSON.parse(record.files) as {
      name: string;
      path: string;
      size: number;
    }[];
    await deleteFiles(files.map((file) => file.path));
  } catch {}

  // 3. delete record
  await db.prepare(`DELETE FROM upload_record WHERE id = ?`).bind(id).run();
}
