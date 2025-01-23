export function getFormDataStream(formData: FormData, onReadProgress: (sent: number, total: number) => void): { size: number, boundary: string, stream: ReadableStream<Uint8Array> } {
  const boundary = `------------${Date.now().toString(36)}`;

  let size = 0;
  const parts: (Blob | Uint8Array)[] = [];

  const encoder = new TextEncoder();
  const encode = (str: string) => encoder.encode(str);

  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      const part = encode(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`);
      parts.push(part);
      size += part.length;
      return;
    }

    const leading = encode(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${value.name}"\r\nContent-Type: ${value.type}\r\n\r\n`);
    parts.push(leading);
    size += leading.length;

    parts.push(value);
    size += value.size;

    parts.push(encode(`\r\n`));
    size += 2;
  });

  const lastBoundary = encode(`--${boundary}--\r\n`);
  parts.push(lastBoundary);
  size += lastBoundary.length;

  let sent = 0;
  let aborted = false;
  let currentFileReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const part of parts) {
        if (aborted) return;
        if (part instanceof Uint8Array) {
          controller.enqueue(part);
          sent += part.length;
          onReadProgress(sent, size);
        } else {
          currentFileReader = part.stream().getReader();
          while (!aborted) {
            const { done, value } = await currentFileReader.read().catch(() => ({ value: undefined, done: true }))
            if (done) break;
            controller.enqueue(value!);
            sent += value!.length;
            onReadProgress(sent, size);
          }
          currentFileReader = undefined;
        }
      }
      controller.close();
    },
    cancel(reason) {
      aborted = true;
      currentFileReader?.cancel(reason);
    },
  })

  return { size, boundary, stream };
}
