import { useState } from 'react';
import './App.scss';
import { ContentInput } from './components/ContentInput';
import { UploadRecords } from './components/UploadRecords';
import { passwordAtom } from './store/auth';
import { store } from './store';
import { PasswordInput } from './components/PasswordInput';
import { useAtom } from 'jotai';
import { clearFiles, inputFilesAtom, inputTextAtom } from './store/input';

const App = () => {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useAtom(inputTextAtom);
  const [files] = useAtom(inputFilesAtom);

  function startUpload() {
    return new Promise<void>((resolve, reject) => {
      const body = new FormData();
      body.append('message', text);
      files.forEach((file) => body.append('files', file.blob));
      files.forEach((file) => body.append('thumbnails', file.thumbnail || ''));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-uploader', 'yon');
      xhr.setRequestHeader('x-password', store.get(passwordAtom));

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
          window.dispatchEvent(new Event('records-updated'));
          setText('');
          clearFiles();
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
    <div className="bg-gray-2 h-vh flex flex-col">
      <ContentInput onSend={startUpload} />
      <SimpleProgressBar progress={progress} />
      <div className="flex-1 overflow-auto">
        <UploadRecords />
      </div>
      <PasswordInput />
    </div>
  );
};

function SimpleProgressBar(props: { progress: number }) {
  return (
    <div className="bg-gray-3 h-2 rounded overflow-hidden">
      <div className="bg-brand-6 h-full" style={{ width: `${props.progress}%` }} />
    </div>
  );
}

export default App;
