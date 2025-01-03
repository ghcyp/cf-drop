import { Hono } from "hono";
import {
  createUploadRecord,
  getUploadRecords,
  migrateTables,
  purgeRecordsBeforeId,
} from "./database";

type Bindings = {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/list", async (c) => {
  await migrateTables(c.env.DB);

  const beforeId = +c.req.query("beforeId")!;
  const list = await getUploadRecords(c.env.DB, { beforeId });
  return c.json(list);

  // const r = await createUploadRecord(c.env.DB, {
  //   uploader: 'yon',
  //   size: 0,
  //   thumbnail: null,
  //   files: '',
  //   message: '',
  // })
  // return c.json(r)
});

app.post("/api/upload", async (c) => {
  const uploader = c.req.header("x-uploader") || "unknown";
  const body = await c.req.formData();

  const files = body.getAll("files").filter((file) => file instanceof File);
  const message = String(body.get("message") || "");

  if (!files.length && !message) {
    return c.json({ error: "No files or message" });
  }

  // upload files to bucket
  const filePathPrefix = `cf_drop/${Date.now()}`;
  const uploadedFiles = await Promise.all(
    files.map(async (file, index) => {
      const fileName = file.name;
      const filePath = `${filePathPrefix}/${fileName}`;
      const r = await c.env.MY_BUCKET.put(filePath, file, {
        httpMetadata: { contentType: file.type },
      });
      return {
        name: fileName,
        path: filePath,
        size: r.size,
      };
    })
  );

  // create record
  const record = await createUploadRecord(c.env.DB, {
    uploader,
    size: uploadedFiles.reduce((acc, file) => acc + file.size, 0),
    thumbnail: "", // uploadedFiles[0]?.path,
    files: JSON.stringify(uploadedFiles),
    message,
  });

  return c.json({ record });
});

app.get("/api/download", async (c) => {
  const filePath = c.req.query("path");
  if (!filePath) {
    return c.json({ error: "No file path" });
  }

  const r = await c.env.MY_BUCKET.get(filePath, {
    range: c.req.header("range"),
  });

  if (!r) {
    c.status(404);
    return c.json({ error: "File not found" });
  }

  const headers = new Headers();
  headers.set("accept-ranges", "bytes");
  r.writeHttpMetadata(headers);
  return new Response(r.body, { headers });
});

app.post("/api/purge", async (c) => {
  const beforeId = 9999999;
  await purgeRecordsBeforeId(c.env.DB, beforeId, (paths) =>
    c.env.MY_BUCKET.delete(paths)
  );
  return c.json({ ok: true });
});

export default app;
