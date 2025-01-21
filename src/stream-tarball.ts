import { getRangeFromRequestHeader, getSlicedStream } from "./file";

interface TarballFile {
  name: string;
  size: number;
  mtime: number;
  read(offset: number, length: number): Promise<Uint8Array | { stream: ReadableStream<Uint8Array>, offset: number, length: number }>;
}

type TarballLayoutItem = [offset: number, data: TarballFile['read']];
function createTarballLayout(files: TarballFile[]) {
  // sort by name
  const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
  const blocks: TarballLayoutItem[] = [];
  let size = 0;
  const dirnames = new Set(['']);
  sorted.forEach(f => {
    const dir = dirname(f.name);
    if (!dirnames.has(dir)) {
      dirnames.add(dir);
      blocks.push([size, async () => createDirectoryTarHeader(dir)]);
      size += 512;
    }

    blocks.push([size, async () => createTarHeader({
      fileName: f.name,
      fileSize: f.size,
      mtime: f.mtime,
    })]);
    size += 512;

    blocks.push([size, f.read]);
    size += Math.ceil(f.size / 512) * 512;
  })

  blocks.push([size, async () => new Uint8Array(0)]);

  return { blocks, size };
}

export function createSeekableTarball(files: TarballFile[]) {
  const { blocks, size } = createTarballLayout(files);
  const lastValidBlockIndex = blocks.length - 2; // last block is empty

  /**
   * 
   * @param rangeHeader - optional, e.g. "bytes=0-100" or "bytes=100-"
   * @returns 
   */
  function getReader(rangeHeader?: string): {
    start: number,
    end: number,
    stream: ReadableStream<Uint8Array>
  } {
    const [start, end] = getRangeFromRequestHeader(size, rangeHeader);

    let subReader: ReadableStream<Uint8Array> | undefined;
    let aborted = false;
    const iterator = (async function* () {
      let i = 0; // current block index
      while (i <= lastValidBlockIndex && start > blocks[i + 1][0]) i++; // skip first Nth blocks

      let sliceBytes = start - blocks[i][0];  // after first block consumed, set to 0

      // read blocks
      for (; i <= lastValidBlockIndex; i++) {
        const [offset, read] = blocks[i];
        if (offset >= end) return;

        const blockEnd = blocks[i + 1][0];
        const readSize = Math.min(blockEnd, end) - offset - sliceBytes
        const readResult = await read(sliceBytes, readSize);

        if (readResult instanceof Uint8Array) {
          console.log(`[block${i}] block is not a stream`, readResult.length);
          yield readResult.subarray(sliceBytes, sliceBytes + readSize);
          sliceBytes = 0;
          continue;
        }

        // is a stream, make a slice
        console.log(`[block${i}] block is a stream. req [${sliceBytes},${readSize}] get [${readResult.offset},${readResult.length}]`);
        const sliceLeading = sliceBytes - readResult.offset;  // reader might return more leading bytes

        subReader = getSlicedStream(readResult.stream, sliceLeading, readSize)
        yield* subReader

        subReader = undefined;
        sliceBytes = 0;
      }
    })();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of iterator) {
          if (aborted) return;
          controller.enqueue(chunk);
        }
      },
      cancel(reason) {
        aborted = true;
        subReader?.cancel(reason);
      },
    })

    return { start, end, stream }
  }

  return {
    size,
    getReader,
  }
}

function padAndSlice(input: string, length: number): string {
  const buffer = input.padEnd(length, '\0');
  return buffer.slice(0, length);
}

function toOctalString(num: number, length: number): string {
  const octalString = num.toString(8); // Convert to octal string
  return padAndSlice(octalString, length - 1) + '\0'; // Pad and ensure null-terminated
}

function computeChecksum(header: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < header.length; i++) {
    sum += header[i];
  }
  return sum;
}

function dirname(path: string): string {
  let idx = path.lastIndexOf('/');
  if (idx === -1) return '';
  return path.substring(0, idx);
}

function createDirectoryTarHeader(name: string): Uint8Array {
  if (!name.endsWith('/')) name += '/';
  return createTarHeader({
    fileName: name,
    fileSize: 0,
    mode: 0o755,
    typeFlag: '5',
  })
}

function createTarHeader({
  fileName = '',
  fileSize = 0,
  mode = 0o644,
  uid = 0,
  gid = 0,
  mtime = Math.floor(Date.now() / 1000),
  typeFlag = '0',
  linkName = '',
  magic = 'ustar',
  version = '00',
  uname = '',
  gname = '',
  devMajor = 0,
  devMinor = 0,
  prefix = ''
}): Uint8Array {
  const header = new Uint8Array(512);

  const data = [
    { start: 0, length: 100, value: padAndSlice(fileName, 100) },
    { start: 100, length: 8, value: toOctalString(mode, 8) },
    { start: 108, length: 8, value: toOctalString(uid, 8) },
    { start: 116, length: 8, value: toOctalString(gid, 8) },
    { start: 124, length: 12, value: toOctalString(fileSize, 12) },
    { start: 136, length: 12, value: toOctalString(mtime, 12) },
    { start: 148, length: 8, value: '        ' }, // Placeholder for checksum
    { start: 156, length: 1, value: padAndSlice(typeFlag, 1) },
    { start: 157, length: 100, value: padAndSlice(linkName, 100) },
    { start: 257, length: 6, value: padAndSlice(magic, 6) },
    { start: 263, length: 2, value: padAndSlice(version, 2) },
    { start: 265, length: 32, value: padAndSlice(uname, 32) },
    { start: 297, length: 32, value: padAndSlice(gname, 32) },
    { start: 329, length: 8, value: toOctalString(devMajor, 8) },
    { start: 337, length: 8, value: toOctalString(devMinor, 8) },
    { start: 345, length: 155, value: padAndSlice(prefix, 155) },
  ];

  data.forEach(({ start, length, value }) => {
    for (let i = 0; i < length; i++) {
      header[start + i] = value.charCodeAt(i) || 0;
    }
  });

  // Calculate and write the checksum
  const checksum = toOctalString(computeChecksum(header), 8);
  for (let i = 0; i < 8; i++) {
    header[148 + i] = checksum.charCodeAt(i) || 32; // Fill with spaces if necessary
  }

  return header;
}