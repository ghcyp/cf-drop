import { useState } from 'react';
import './App.css';
import { ContentInput } from './components/ContentInput';
import { UploadRecords } from './components/UploadRecords';

const App = () => {
  const [progress, setProgress] = useState(0);
  function startUpload(text: string, files: File[]) {
    return new Promise<void>((resolve, reject) => {
      const body = new FormData();
      body.append('message', text);
      files.forEach((file) => body.append('files', file));
      files.forEach((file) => body.append('thumbnails', file.thumbnail || ''));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-uploader', 'yon');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        console.log('upload response', xhr.responseText);

        if (xhr.status === 200) {
          // const data = JSON.parse(xhr.responseText);
          setProgress(0);
          window.dispatchEvent(new Event('upload-complete'));
          resolve();
          return;
        }

        reject(new Error('Upload failed'));
      };

      xhr.onerror = (e) => {
        console.error('upload error', e);
        reject(new Error('Upload failed'));
      };

      xhr.send(body);
    });
  }

  return (
    <div className="bg-slate-2 h-vh flex flex-col">
      <ContentInput onSend={startUpload} />
      <SimpleProgressBar progress={progress} />
      <div className="flex-1 overflow-auto">
        <UploadRecords />
      </div>
    </div>
  );
};

function SimpleProgressBar(props: { progress: number }) {
  return (
    <div className="bg-slate-4 h-2 rounded overflow-hidden">
      <div className="bg-slate-6 h-full" style={{ width: `${props.progress}%` }} />
    </div>
  );
}

export default App;
