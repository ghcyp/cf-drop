import { memo, useMemo, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import type { UploadRecord } from '../../../src/database';

interface Props {}

export const UploadRecords = memo<Props>((props) => {
  // all records. newest first
  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite(
    (_, page?: UploadRecord[]) => (page ? String(page?.at(-1)?.id ?? '') : 'init'),
    (beforeId) => fetch('/api/list?beforeId=' + beforeId).then((res) => res.json() as Promise<UploadRecord[]>),
  );

  console.log('data', data);

  return (
    <div className="p-4">
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data?.map((page, i) => (
        <div key={i}>
          {page.map((record) => (
            <UploadRecordItem key={record.id} record={record} />
          ))}
        </div>
      ))}
      <button onClick={() => setSize(size + 1)} disabled={isValidating}>
        {isValidating && <i className="i-mdi-loading animate-spin"></i>}
        Load more
      </button>
    </div>
  );
});

const UploadRecordItem = memo((props: { record: UploadRecord }) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(!open);

  const files = useMemo(() => {
    if (!props.record.files) return [];
    return JSON.parse(props.record.files) as { name: string; path: string; size: number }[];
  }, [props.record.files]);

  return (
    <div className="p-4 rounded-lg bg-white shadow-2xl mb-2">
      <div className="flex gap-4 text-sm text-gray">
        <span>
          <i className="i-mdi-user mr-1"></i>
          {props.record.uploader}
        </span>
        <span>
          <i className="i-mdi-clock mr-1"></i>
          {new Date(props.record.ctime).toLocaleString()}
        </span>
        {!!props.record.size && (
          <span>
            <i className="i-mdi-database mr-1"></i>
            {toReadableSize(props.record.size)}
          </span>
        )}
      </div>

      {props.record.thumbnail}
      <pre className="max-h-md overflow-auto ws-pre-wrap" onClick={toggleOpen}>
        {props.record.message}
      </pre>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file) => {
            const link = `/api/download?path=${encodeURIComponent(file.path)}`;
            return (
              <div key={file.path} className="flex gap-2">
                <a href={link} target="_blank" rel="noreferrer" className="flex gap-2 items-center decoration-none">
                  <i className="i-mdi-download"></i>
                  <span>{file.name}</span>
                  <span className="text-sm text-gray">{toReadableSize(file.size)}</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

function toReadableSize(size: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let unit = 0;
  while (size >= 1024) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}
