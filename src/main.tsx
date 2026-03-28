import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;

declare global {
  var __react_root__: any;
}

if (!globalThis.__react_root__) {
  globalThis.__react_root__ = createRoot(container);
}

globalThis.__react_root__.render(<App />);
