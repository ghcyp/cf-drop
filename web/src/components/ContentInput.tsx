import { memo, useState } from 'react';

interface Props {
  onTextChange?: (text: string) => void;
  onFilesChange?: (files: File[]) => void;
  onSend?: (text: string, files: File[]) => void;
}

export const ContentInput = memo<Props>((props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle pasted text
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      setText(pastedText);
      props.onTextChange?.(pastedText);
    }

    // Handle pasted files
    const pastedFiles = Array.from(e.clipboardData.files);
    if (pastedFiles.length) {
      setFiles((prev) => [...prev, ...pastedFiles]);
      props.onFilesChange?.([...files, ...pastedFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      props.onFilesChange?.([...files, ...droppedFiles]);
    }
  };

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
      setFiles((prev) => [...prev, ...files]);
      props.onFilesChange?.([...files, ...files]);
    };
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    props.onFilesChange?.(newFiles);
  };

  const handleSend = () => {
    props.onSend?.(text, files);
  };

  return (
    <div
      className="p-4 border-2 border-dashed border-gray-300 rounded-lg"
      onPasteCapture={handlePaste}
      onDragOverCapture={handleDragOver}
      onDropCapture={handleDrop}
    >
      <div className="flex mb-4 rounded-md border-1 border-solid border-slate-6 overflow-hidden">
        <textarea
          value={text}
          onChange={handleTextChange}
          className="w-full p-2 border-0 resize-y flex-1 outline-0 h-20"
          placeholder="Type or paste text here..."
        />

        <button
          className="w-20 border-0 bg-slate-6 text-white text-xl disabled:bg-slate-4"
          onClick={handleSend}
          disabled={!text && !files.length}
        >
          <i className="i-mdi-send"></i>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="bg-slate-6 text-white text-xl rounded-md border-0" onClick={openFilePicker}>
          <i className="i-mdi-file-plus mr-1"></i>
          Add file
        </button>

        {files.map((file, index) => (
          <div key={index} className="bg-slate-6 text-white text-xl rounded-md gap-2">
            <span>{file.name}</span>
            <button onClick={() => removeFile(index)} className="text-red-500 hover:bg-slate-4 h-full border-0">
              <i className="i-mdi-delete"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});
