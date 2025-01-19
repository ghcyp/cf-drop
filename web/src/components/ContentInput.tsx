import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useConsistCallback } from '../utils/useConsistCallback';
import { isEqual } from '../utils/isEqual';
import { createThumbnail } from '../utils/createThumbnail';
import { getFilesFromDataTransferItem } from '../utils/fileEntry';

interface Props {
  text?: string;
  files?: File[];
  onTextChange?: (text: string) => void;
  onFilesChange?: (files: File[]) => void;
  onSend?: (text: string, files: File[]) => Promise<any>;
}

export const ContentInput = memo<Props>((props) => {
  const [files, setFiles] = useState<File[]>(props.files?.slice() ?? []);
  const [text, setText] = useState(props.text ?? '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleFilesChange = useConsistCallback((cb: (files: File[]) => File[]) => {
    let files: File[];
    setFiles((oldFiles) => {
      files = cb(oldFiles.slice());
      return files;
    });

    setTimeout(async () => {
      const thumbnailAdded = await Promise.all(files.map(addThumbnail));
      if (thumbnailAdded.some((added) => added)) setFiles(files.slice());

      props.onFilesChange?.(files);
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 0 && totalSize < 10e6 && !text) {
        // Send if files are uploaded and total size is less than 10MB
        props.onSend?.(text, files)
      }
    }, 0);
  });

  const [isDragOver, setIsDragOver] = useState(false);
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Handle pasted files
      const pastedFiles = Array.from(e.clipboardData?.files ?? []);
      if (pastedFiles.length) {
        handleFilesChange((prev) => [...prev, ...pastedFiles]);
      }

      // Handle pasted text
      const pastedText = e.clipboardData?.getData('text/plain');
      if (pastedText) {
        const textarea = textAreaRef.current;
        if (textarea) {
          textarea.focus();
          const selectionStart = textarea.selectionStart;
          const selectionEnd = textarea.selectionEnd;
          const oldText = textarea.value;
          const newText = oldText.slice(0, selectionStart) + pastedText + oldText.slice(selectionEnd);
          setText(newText);

          setTimeout(() => {
            textarea.selectionStart = selectionStart + pastedText.length;
            textarea.selectionEnd = selectionStart + pastedText.length;
          }, 0);
        } else {
          setText(pastedText);
        }
      }

      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.some((type) => type === 'Files')) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(true);
    };

    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('dragover', handleDragOver, true);

    return () => {
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('dragover', handleDragOver, true);
    };
  }, []);

  useEffect(() => {
    if (!isDragOver) {
      document.body.style.pointerEvents = 'auto';
      return;
    }

    document.body.style.pointerEvents = 'none';

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      setIsDragOver(false);
      e.preventDefault();
      e.stopPropagation();

      const promises = Array.from(e.dataTransfer?.items || [], getFilesFromDataTransferItem)
      Promise.all(promises).then((files) => {
        const droppedFiles = ([] as File[]).concat(...files);
        if (droppedFiles.length) {
          handleFilesChange((prev) => [...prev, ...droppedFiles]);
        }
      });
    };

    window.addEventListener('drop', handleDrop, true);
    window.addEventListener('dragleave', handleDragLeave, true);

    return () => {
      window.removeEventListener('drop', handleDrop, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
    };
  }, [isDragOver]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    props.onTextChange?.(e.target.value);
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.click();
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files) as File[];
      handleFilesChange((prev) => [...prev, ...files]);
    };
  };

  const removeFile = useConsistCallback((index: number) => {
    handleFilesChange((files) => files.filter((_, i) => i !== index));
  });

  const handleSend = useConsistCallback(() => {
    props.onSend?.(text, files)
  });

  const doClear = useConsistCallback(() => {
    setFiles([]);
    setText('');
    props.onTextChange?.('');
    props.onFilesChange?.([]);
  });

  useEffect(() => { if (props.text !== undefined && props.text !== text) setText(props.text); }, [props.text]);
  useEffect(() => { if (props.files !== undefined && !isEqual(props.files, files)) setFiles(props.files); }, [props.files]);

  return (
    <div
      tabIndex={-1}
      className="p-4 outline-0"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          handleSend();
        }
      }}
    >
      <div className="flex mb-4 rounded-md shadow overflow-hidden outline-1 outline-solid outline-transparent focus-within:outline-brand-6 focus-within:ring focus-within:ring-brand-3">
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          className="w-full p-2 border-0 resize-y flex-1 outline-0 h-20 min-h-10"
          placeholder="Type or paste text / files here..."
        />

        <button className="w-20 rounded-none" onClick={handleSend} disabled={!text && !files.length}>
          <i className="i-mdi-send"></i>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={openFilePicker} key='addFileBtn'>
          <i className="i-mdi-file-plus"></i>
          Add file
        </button>

        {files.map((file, index) => <AttachedFileItem file={file} index={index} removeFile={removeFile} key={index} />)}

        <button onClick={doClear} className='btn-gray' key='clearBtn'>
          Clear
        </button>
      </div>

      {!!isDragOver && (
        <div className="fixed inset-0 bg-gray-3 opacity-50 flex items-center justify-center pointer-events-none">
          <div className="animate-slide-in-up animate-duration-200 text-center">
            <i className="i-mdi-upload text-[64px]"></i>
            <div className="text-center text-2xl">Drop files to add</div>
          </div>
        </div>
      )}
    </div>
  );
});

declare global {
  interface File {
    thumbnail?: string;
  }
}

function AttachedFileItem({ index, file, removeFile }: { index: number; file: File; removeFile: (index: number) => void; }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <div key={index} className="bg-brand-4 text-white rounded-md flex items-center text-sm overflow-hidden">
    {file.thumbnail ? (
      <img src={file.thumbnail} className="w-[2em] h-[2em] rounded-md mx-1" />
    ) : (
      <div className="pl-3" />
    )}
    <a
      download={file.name}
      href={url}
      title={file.name}
      className="truncate max-w-48 text-inherit decoration-none hover:decoration-underline">{file.name}</a>
    <button
      onClick={() => removeFile(index)}
      className="text-white hover:bg-red-400 transition-colors border-0 bg-transparent flex items-center self-stretch px-3"
    >
      <i className="i-mdi-close"></i>
    </button>
  </div>;
}

export async function addThumbnail(file: File) {
  if (!file.type.startsWith('image/')) return false;
  if (file.thumbnail) return false; // already has thumbnail

  const url = URL.createObjectURL(file);
  try {
    file.thumbnail = await createThumbnail(url);
  } finally {
    URL.revokeObjectURL(url);
  }

  return true;
}

