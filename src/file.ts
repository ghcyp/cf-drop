export function generateContentRangeHeader(range: R2Range, totalSize: number): string {
  let contentRange = "bytes ";

  if ('offset' in range) {
    const start = range.offset || 0;
    const end = range.length ? (start + range.length - 1) : (totalSize - 1);
    contentRange += `${start}-${end}/${totalSize}`;
  } else if ('suffix' in range) {
    const suffixLength = range.suffix;
    contentRange += `${totalSize - suffixLength}-${totalSize - 1}/${totalSize}`;
  } else {
    return '';
  }

  return contentRange;
}

export function getRangeFromRequestHeader(size: number, header?: string): [start: number, until: number] {
  const mat = /^bytes=(\d*)-(\d*)$/.exec(header!);
  if (!mat) return [0, size];

  let start = parseInt(mat[1]);
  let end = parseInt(mat[2]);

  // only last N bytes ( bytes=-100 ) // end is actually the number of bytes
  if (!mat[1]) return [size - end, size];

  // now "start" must have a value
  if (start < 0) throw new Error('Invalid range');
  if (start >= size) start = size - 1;

  // since Nth bytes ( bytes=100- )
  if (!mat[2]) return [start, size];

  // now "end" must have a value
  if (end < start) throw new Error('Invalid range');
  if (end >= size) end = size - 1;

  return [start, end + 1];
}

export function getSlicedStream(stream: ReadableStream<Uint8Array>, offset: number, length: number): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let totalRead = 0;
  let done = false;

  return new ReadableStream({
    start(controller) {
      if (offset < 0) {
        const padding = new Uint8Array(-offset);
        offset = 0;
        totalRead += padding.length;
        controller.enqueue(padding);
      }
    },

    async pull(controller) {
      if (done) return;

      do {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) {
          done = true;
          // maybe need padding?
          const paddingSize = length - totalRead;
          if (paddingSize > 0) {
            const padding = new Uint8Array(paddingSize);
            controller.enqueue(padding);
          }
          controller.close();
          return;
        }

        let chunk = value;
        if (offset > 0) {
          const skipped = Math.min(offset, chunk.length);
          chunk = chunk.subarray(skipped);
          offset -= skipped;
          if (offset <= 0) continue; // insufficient data! read next chunk
        }

        totalRead += chunk.length;
        if (totalRead > length) chunk = chunk.subarray(0, length - totalRead);
        controller.enqueue(chunk);

        if (totalRead >= length) {
          controller.close();
          done = true;
        }
      } while (0);
    },
  });
}
