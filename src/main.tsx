import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppContainer } from './App/App.container';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('index.html is missing the #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppContainer />
  </StrictMode>,
);
