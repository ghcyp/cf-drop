import './App.scss';
import { ContentInput } from './components/ContentInput';
import { UploadRecords } from './components/UploadRecords';
import { PasswordInput } from './components/PasswordInput';
import { useAtom } from 'jotai';
import { uploadingErrorAtom, uploadingProgressAtom } from './store/uploading';

const App = () => {
  return (
    <div className="bg-gray-2 h-vh flex flex-col">
      <ContentInput />
      <SimpleProgressBar />
      <div className="flex-1 withScrollbar">
        <UploadRecords />
      </div>
      <PasswordInput />
    </div>
  );
};

function SimpleProgressBar() {
  const [progress] = useAtom(uploadingProgressAtom)
  const [error] = useAtom(uploadingErrorAtom)

  return (<>
    {!!error && <div className="bg-red-1 p-2 text-red-6 text-sm">
      {error}
    </div>}
    <div className="bg-gray-3 h-2 overflow-hidden">
      <div className="bg-brand-6 h-full" style={{ width: `${progress}%` }} />
    </div>
  </>);
}

export default App;
