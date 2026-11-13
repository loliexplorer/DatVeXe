import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StaffApp from './StaffApp.jsx';

createRoot(document.getElementById('staff-root')).render(
  <StrictMode>
    <StaffApp />
  </StrictMode>,
);