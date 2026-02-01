import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary'; // 1. Import it

// Styles
import './index.css';
import './styles/theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // 2. Wrap App with it
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);