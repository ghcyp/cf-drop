import { memo, useEffect, useRef, useState } from 'react';
import { useConsistCallback } from '../hooks/useConsistCallback';

interface Props {
  onTextChange?: (text: string) => void;
  onFilesChange?: (files: File[]) => void;
  onSend?: (text: string, files: File[]) => Promise<any>;
}

export const ContentInput = memo<Props>((props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');
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
        Promise.resolve(props.onSend?.(text, files)).then(() => {
          setFiles([]);
        });
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

      const droppedFiles = Array.from(e.dataTransfer!.files);
      if (droppedFiles.length) {
        handleFilesChange((prev) => [...prev, ...droppedFiles]);
      }
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
    Promise.resolve(props.onSend?.(text, files)).then(() => {
      setFiles([]);
      setText('');
    });
  });

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
        <button onClick={openFilePicker}>
          <i className="i-mdi-file-plus"></i>
          Add file
        </button>

        {files.map((file, index) => (
          <div key={index} className="bg-brand-4 text-white rounded-md flex items-center text-sm overflow-hidden">
            {file.thumbnail ? (
              <img src={file.thumbnail} className="w-[2em] h-[2em] rounded-md mx-1" />
            ) : (
              <div className="pl-3" />
            )}
            <span className="truncate max-w-48">{file.name}</span>
            <button
              onClick={() => removeFile(index)}
              className="text-white hover:bg-red-400 transition-colors border-0 bg-transparent flex items-center self-stretch px-3"
            >
              <i className="i-mdi-close"></i>
            </button>
          </div>
        ))}
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

export async function addThumbnail(file: File) {
  if (!file.type.startsWith('image/')) return false;
  if (file.thumbnail) return false; // already has thumbnail

  const url = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
  file.thumbnail = thumbnail;

  return true;
}
