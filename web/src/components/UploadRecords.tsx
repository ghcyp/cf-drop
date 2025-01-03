import { memo, useEffect, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import type { RecordFileItem, UploadRecord } from '../../../src/database';

interface Props {}

export const UploadRecords = memo<Props>((props) => {
  // all records. newest first
  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite(
    (_, page?: UploadRecord[]) => (page ? String(page?.at(-1)?.id ?? '') : 'init'),
    (beforeId) => fetch('/api/list?beforeId=' + beforeId).then((res) => res.json() as Promise<UploadRecord[]>),
  );

  useEffect(() => {
    const refresh = () => {
      mutate();
    };
    window.addEventListener('upload-complete', refresh);
    return () => window.removeEventListener('upload-complete', refresh);
  }, [mutate]);

  return (
    <div className="p-4">
      {error && <div className="text-red-500 mb-4">Error: {error.message}</div>}
      {data?.map((page, i) => (
        <div key={i}>
          {page.map((record) => (
            <UploadRecordItem key={record.id} record={record} />
          ))}
        </div>
      ))}
      <button
        onClick={() => setSize(size + 1)}
        disabled={isValidating}
        className="w-full max-w-md mx-auto block py-3 px-6 my-8 bg-slate-6 text-white rounded-md hover:bg-slate-5 disabled:bg-slate-4 transition-colors"
      >
        {isValidating && <i className="i-mdi-loading animate-spin mr-2"></i>}
        Load more
      </button>
    </div>
  );
});

const UploadRecordItem = memo((props: { record: UploadRecord }) => {
  const files = useMemo(() => {
    if (!props.record.files) return [];
    return JSON.parse(props.record.files) as RecordFileItem[];
  }, [props.record.files]);

  return (
    <div className="p-4 rounded-lg bg-white shadow mb-2">
      <div className="flex gap-4 text-sm text-gray flex-wrap">
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

        <div className="mr-a">
          <br />
        </div>

        {!!props.record.message && (
          <span className="cursor-pointer hover:text-black" onClick={() => copyToClipboard(props.record.message)}>
            <i className="i-mdi-clipboard mr-1"></i>
            Copy Message
          </span>
        )}

        <span className="cursor-pointer hover:text-red" onClick={() => deleteRecord(props.record.id)}>
          <i className="i-mdi-trash mr-1"></i>
          Delete
        </span>
      </div>

      <pre className="max-h-md overflow-auto ws-pre-wrap">{props.record.message}</pre>

      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file) => {
            const link = `/api/download?path=${encodeURIComponent(file.path)}`;
            return (
              <div key={file.path} className="flex gap-2 m--2 mr-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-2 items-center decoration-none text-blue-6 hover:bg-blue-1 rounded p-2"
                >
                  {file.thumbnail ? (
                    <>
                      <img src={file.thumbnail} className="w-16 h-16 rounded-md mr-1" />
                      <div className="flex flex-col gap-1">
                        <span>{file.name}</span>
                        <span className="text-sm text-gray">{toReadableSize(file.size)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <i className="i-mdi-file-outline"></i>
                      <span>{file.name}</span>
                      <span className="text-sm text-gray">{toReadableSize(file.size)}</span>
                    </>
                  )}
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

function copyToClipboard(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function deleteRecord(id: number) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  fetch('/api/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('deleted data', data);
      window.dispatchEvent(new Event('upload-complete'));
    });
}
