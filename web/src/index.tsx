import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'jotai';
import { store } from './store';
import App from './App';
import 'uno.css';
import './sw-client';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}
