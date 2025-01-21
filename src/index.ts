import { Hono } from "hono";
import {
  createUploadRecord,
  deleteRecord,
  listUploadRecords,
  getUploadRecordBySlug,
  migrateTables,
  purgeRecordsBeforeId,
} from "./database";
import { H } from "hono/types";
import { createSeekableTarball } from "./stream-tarball";
import { generateContentRangeHeader } from "./file";

type Bindings = {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
  MY_BUCKET: R2Bucket;
  PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const authWithPassword: H<{ Bindings: Bindings }> = async (c, next) => {
  if (c.env.PASSWORD && c.req.header("x-password") !== c.env.PASSWORD) {
    c.status(401);
    return c.json({ error: "Password required" });
  }

  return await next();
};

app.get("/api/list", authWithPassword, async (c) => {
  await migrateTables(c.env.DB);

  const beforeId = +c.req.query("beforeId")!;
  const list = await listUploadRecords(c.env.DB, { beforeId });
  return c.json(list);

  // const r = await createUploadRecord(c.env.DB, {
  //   uploader: 'yon',
  //   size: 0,
  //   files: '',
  //   message: '',
  // })
  // return c.json(r)
});

app.post("/api/upload", authWithPassword, async (c) => {
  const uploader = c.req.header("x-uploader") || "unknown";
  const body = await c.req.formData();

  const files = body.getAll("files").filter((file) => file instanceof File);
  const thumbnails = body.getAll("thumbnails") as string[];
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
        thumbnail: thumbnails[index] || "",
      };
    })
  );

  // create record
  const record = await createUploadRecord(c.env.DB, {
    uploader,
    size: uploadedFiles.reduce((acc, file) => acc + file.size, 0),
    files: uploadedFiles,
    message,
  });

  return c.json({ record });
});

app.get("/api/download/:slug/message", async (c) => {
  const slug = c.req.param("slug");
  const record = await getUploadRecordBySlug(c.env.DB, slug);
  if (!record) return c.status(404);
  return c.text(record.message);
})

app.get("/api/download/:slug/tarball", async (c) => {
  const slug = c.req.param("slug");
  const record = await getUploadRecordBySlug(c.env.DB, slug);
  if (!record) return c.status(404);

  const tarball = createSeekableTarball(record.files.map(f => ({
    mtime: record.ctime,
    name: f.name,
    size: f.size,
    read: async (iOffset, iLength) => {
      const x = await c.env.MY_BUCKET.get(f.path, { range: { offset: iOffset, length: iLength } });
      if (!x) throw new Error('File not found');

      let offset = 0;
      let length = x.size;

      if (x.range && 'offset' in x.range) {
        offset = x.range.offset!;
        length = x.range.length!;
      }

      return {
        stream: x.body,
        offset,
        length,
      };
    }
  })));

  const reqRange = c.req.header("range");
  const reader = tarball.getReader(reqRange);

  c.status(reqRange ? 206 : 200);
  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Disposition", `attachment; filename="${record.slug}.tar"`);
  c.header("Accept-Ranges", "bytes");
  c.header("Content-Length", String(reader.end - reader.start + 1));
  if (reqRange) c.header("Content-Range", `${reader.start}-${reader.end}/${tarball.size}`);

  return c.body(reader.stream);
})

const RE_ASSET_SUFFIX = /\.(jpg|png|gif|avif|mp4|mov|txt|html|js|css|json|ya?ml)/;
app.get("/api/download/:slug/:index", async (c) => {
  const slug = c.req.param("slug");
  const index = c.req.param("index");
  const record = await getUploadRecordBySlug(c.env.DB, slug);
  if (!record) {
    return c.status(404);
  }

  const filePath = record.files[+index]?.path;
  if (!filePath) {
    return c.status(404);
  }

  const r = await c.env.MY_BUCKET.get(filePath, {
    range: c.req.raw.headers
  });

  if (!r) {
    c.status(404);
    return c.json({ error: "File not found" });
  }

  const basename = filePath.split("/").pop()!.replace(/\?.*/, "");
  const headers = new Headers();

  r.writeHttpMetadata(headers);
  if (r.range && c.req.header('Range')) {
    c.status(206);
    headers.set("content-range", generateContentRangeHeader(r.range, r.size));
  }
  headers.set("accept-ranges", "bytes");

  if (!RE_ASSET_SUFFIX.test(basename)) headers.set("content-disposition", `attachment; filename="${basename}"`);
  headers.forEach((value, key) => c.header(key, value));
  return c.body(r.body)
});

app.post("/api/delete", authWithPassword, async (c) => {
  const body = await c.req.json();
  const id = +body.id;
  await deleteRecord(c.env.DB, id, (paths) => c.env.MY_BUCKET.delete(paths));
  return c.json({ ok: true });
});

app.post("/api/purge", authWithPassword, async (c) => {
  const beforeId = 9999999;
  await purgeRecordsBeforeId(c.env.DB, beforeId, (paths) =>
    c.env.MY_BUCKET.delete(paths)
  );
  return c.json({ ok: true });
});

export default app;
