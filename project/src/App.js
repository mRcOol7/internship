import React from 'react';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import { Analytics } from "@vercel/analytics/react"
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div>
        <ToastContainer />
        <AppRoutes />
        <Analytics />
    </div>
  )
};

export default App;