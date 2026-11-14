import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { RewardProvider } from './context/RewardContext';
import './index.css';

// HashRouter dipakai agar rute tetap bekerja di Capacitor (Android) dan hosting statis.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <RewardProvider>
          <App />
        </RewardProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
