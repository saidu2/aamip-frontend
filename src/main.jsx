import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141E35',
            color: '#F0F4FF',
            border: '1px solid #2A3A55',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#141E35' } },
          error:   { iconTheme: { primary: '#E74C3C', secondary: '#141E35' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
