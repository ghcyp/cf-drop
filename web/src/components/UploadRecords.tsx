import { memo, useEffect, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { UploadRecord } from '../../../src/database';
import { fetchAPI } from '../store/auth';

dayjs.extend(relativeTime);

interface Props { }

export const UploadRecords = memo<Props>((props) => {
  // all records. newest first
  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite(
    (_, page?: UploadRecord[]) => (page ? String(page?.at(-1)?.id ?? '') : 'init'),
    (beforeId) =>
      fetchAPI('/api/list?beforeId=' + beforeId).then((res) => res.json() as Promise<UploadRecord[]>),
  );

  useEffect(() => {
    const refresh = () => {
      mutate();
    };
    window.addEventListener('records-updated', refresh);
    return () => window.removeEventListener('records-updated', refresh);
  }, [mutate]);

  return (
    <div>
      {error && <div className="text-red-500 mb-4">Error: {error.message}</div>}
      {data?.map((page, i) => (
        <div key={i}>
          {page.map((record) => (
            <UploadRecordItem key={record.id} record={record} />
          ))}
        </div>
      ))}
      <button onClick={() => setSize(size + 1)} disabled={isValidating} className="w-full max-w-md mx-auto my-8 block">
        {isValidating && <i className="i-mdi-loading animate-spin mr-2"></i>}
        Load more
      </button>
    </div>
  );
});

const UploadRecordItem = memo((props: { record: UploadRecord }) => {
  const files = useMemo(() => props.record.files || [], [props.record.files]);

  const actionLink = 'cursor-pointer p-2 m--2 text-inherit decoration-none hover:text-brand-6 hover:bg-brand-1 rounded-lg';

  const meta = <div className="flex gap-2 mb-2 text-xs text-gray">
    <span>
      <i className="i-mdi-user mr-1"></i>
      {props.record.uploader}
    </span>
    <span title={dayjs(props.record.ctime).format('YYYY-MM-DD HH:mm:ss')}>
      <i className="i-mdi-clock mr-1"></i>
      {dayjs(props.record.ctime).fromNow()}
    </span>
    {!!props.record.size && (
      <span title={`${props.record.size} bytes`}>
        <i className="i-mdi-database mr-1"></i>
        {toReadableSize(props.record.size)}
      </span>
    )}
  </div>

  const actions = <div className="flex gap-4 p-2 b-t b-t-gray-2 b-t-solid justify-end text-gray-7 text-sm leading-none">
    {!!props.record.message && (<>
      <a className={actionLink} onClick={(e) => (e.preventDefault(), copyToClipboard(props.record.message))} href='#' role='button'>
        <i className="i-mdi-clipboard mr-1"></i>
        Copy Text
      </a>

      <a
        className={actionLink}
        target="_blank"
        rel="noreferrer"
        href={`/api/download/${encodeURIComponent(props.record.slug)}/message`}
        download={`${props.record.id}.txt`}
      >
        <i className="i-mdi-file-outline mr-1"></i>
        Text File
      </a>
    </>)}

    {
      props.record.files.length > 1 && (
        <a
          className={`${actionLink}`}
          target="_blank"
          rel="noreferrer"
          href={`/api/download/${encodeURIComponent(props.record.slug)}/tarball`}
          download={`${props.record.id}.tar`}
        >
          <i className="i-mdi-archive-outline mr-1"></i>
          Download All
        </a>
      )
    }

    <a className={`${actionLink} hover:text-red`} onClick={(e) => (e.preventDefault(), deleteRecord(props.record.id))} href='#' role='button'>
      <i className="i-mdi-trash mr-1"></i>
      Delete
    </a>
  </div>  

  return (
    <div className="rounded-lg bg-white shadow mb-2">
      <div className='max-h-sm withScrollbar'>
        {meta}
        {!!props.record.message && <pre className="ws-pre-wrap m-0 mb-2 text-sm">{props.record.message}</pre>}
        {files.length > 0 && (
          <div className="flex flex-wrap ml--2 mb--2">
            {files.map((file, index) => {
              const link = `/api/download/${props.record.slug}/${index}`;
              return (
                <div key={file.path} className="flex gap-2 max-w-sm min-w-0">
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    title={file.name}
                    className="flex gap-2 items-center decoration-none text-brand-6 hover:bg-brand-1 rounded p-2 min-w-0"
                  >
                    {file.thumbnail ? (
                      <>
                        <img src={file.thumbnail} className="w-16 h-16 rounded-md mr-1" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="min-w-0 truncate">{file.name}</span>
                          <span className="text-sm text-gray">{toReadableSize(file.size)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="i-mdi-file-outline"></i>
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
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

      {actions}
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
  fetchAPI('/api/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('deleted data', data);
      window.dispatchEvent(new Event('records-updated'));
    });
}
