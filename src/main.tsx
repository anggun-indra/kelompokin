import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from '@/contexts/AuthContext';
import { GroupProvider } from '@/contexts/GroupContext';
import { ConfigProvider } from 'antd';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5', // Brand Indigo
          borderRadius: 16,
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        },
      }}
    >
      <AuthProvider>
        <GroupProvider>
          <App />
        </GroupProvider>
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>
);
