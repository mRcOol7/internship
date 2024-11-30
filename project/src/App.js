import React from 'react';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div>
        <ToastContainer />
        <AppRoutes />
    </div>
  )
};

export default App;