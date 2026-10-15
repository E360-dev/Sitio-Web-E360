// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'
import { AuthProvider } from './context/AuthProvider.jsx'
import { CredencialesProvider } from './context/CredencialesProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CredencialesProvider><App /></CredencialesProvider>
    </AuthProvider>
  </React.StrictMode>
)
