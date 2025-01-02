import { useEffect, useState } from 'react';
import './App.css';

const App = () => {
  const [msg, setMsg] = useState('Hello World');

  useEffect(() => {
    fetch('/api/test')
      .then((res) => res.text())
      .then((text) => setMsg(text));
  }, []);

  return (
    <div className="content">
      <h1>Rsbuild with React!</h1>
      <p>Start building amazing things with Rsbuild.</p>
      <p>Msg from API: {msg}</p>
    </div>
  );
};

export default App;
