import { useState } from 'react';
import './App.css';
import { ContentInput } from './components/ContentInput';
import { UploadRecords } from './components/UploadRecords';

const App = () => {
  const [progress, setProgress] = useState(0);
  function startUpload(text: string, files: File[]) {
    const body = new FormData();
    body.append('message', text);
    files.forEach((file) => body.append('files', file));

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
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log('response', data);
        setProgress(0);
        window.location.reload();
      }
    };

    xhr.send(body);
  }

  return (
    <div className="bg-slate-2 h-vh">
      <ContentInput onSend={startUpload} />
      <SimpleProgressBar progress={progress} />
      <UploadRecords />
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
