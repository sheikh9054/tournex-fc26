import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override global window.fetch to attach stateless verification headers
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const email = localStorage.getItem('tournex_user_email');
  const uid = localStorage.getItem('tournex_user_id');
  
  if (email || uid) {
    init = init || {};
    init.headers = init.headers || {};
    
    if (init.headers instanceof Headers) {
      if (email) init.headers.set('x-user-email', email);
      if (uid) init.headers.set('x-user-id', uid);
    } else if (Array.isArray(init.headers)) {
      if (email) {
        init.headers = init.headers.filter(([k]) => k.toLowerCase() !== 'x-user-email');
        init.headers.push(['x-user-email', email]);
      }
      if (uid) {
        init.headers = init.headers.filter(([k]) => k.toLowerCase() !== 'x-user-id');
        init.headers.push(['x-user-id', uid]);
      }
    } else {
      if (email) init.headers['x-user-email'] = email;
      if (uid) init.headers['x-user-id'] = uid;
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
