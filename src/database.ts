export async function migrateTables(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS upload_record (
      id INTEGER PRIMARY KEY,
      uploader TEXT NOT NULL,
      ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      size INTEGER DEFAULT 0,
      thumbnail TEXT NULL,
      files TEXT DEFAULT '',
      message TEXT DEFAULT ''
    )
  `.replace(/\n/g, ''));
}

export async function getUploadRecords(db: D1Database, opts: { beforeId?: number } = {}) {
  const records: UploadRecord[] = []

  let sql = 'SELECT * FROM upload_record'
  if (opts.beforeId && Number.isInteger(opts.beforeId)) {
    sql += ` WHERE id < ${opts.beforeId}`
  }
  sql += ' ORDER BY id DESC LIMIT 20'

  const rows = await db.prepare(sql).all()
  for (const row of rows.results as any[]) {
    records.push({
      id: row.id,
      uploader: row.uploader,
      ctime: new Date(row.ctime),
      size: row.size,
      thumbnail: row.thumbnail,
      files: row.files,
      message: row.message,
    })
  }
  return records
}

export async function createUploadRecord(db: D1Database, record: Omit<UploadRecord, 'id' | 'ctime'>) {
  const res = await db.prepare('INSERT INTO upload_record (uploader, size, thumbnail, files, message) VALUES (?, ?, ?, ?, ?)').bind(
    record.uploader,
    record.size,
    record.thumbnail,
    record.files,
    record.message,
  ).run()
  const id = res.meta.last_row_id
  const inserted: UploadRecord = {
    ...record,
    ctime: new Date(),
    id,
  }
  return { id, inserted }
}

export interface UploadRecord {
  id: number
  uploader: string
  ctime: Date
  size: number
  thumbnail: string | null
  files: string
  message: string
}
