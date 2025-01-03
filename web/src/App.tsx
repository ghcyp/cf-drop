import './App.css';
import { ContentInput } from './components/ContentInput';
import { UploadRecords } from './components/UploadRecords';

const App = () => {
  function startUpload(text: string, files: File[]) {
    const body = new FormData();
    body.append('message', text);
    files.forEach((file) => body.append('files', file));

    fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-uploader': 'yon',
      },
      body,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('data', data);
      });
  }

  return (
    <div className="bg-slate-2 h-vh">
      <ContentInput onSend={startUpload} />
      <UploadRecords />
    </div>
  );
};

export default App;
