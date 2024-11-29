import React , { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './components/homePage';
import Login from './components/login';
import Signup from './components/signup';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return(
    <Router>
      <Routes>
      <Route path='/login' element={<Login/>} />
      <Route path='/signup' element={<Signup/>} />
      <Route element={<ProtectedRoute/>}>
        <Route path='/' element={<Home/>} />
      </Route>
      </Routes>
      <InitialRoute/>
    </Router>
  );
};

const InitialRoute = () => {
  const Navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { 
      Navigate('/login');
    } 
  },[Navigate]);
  
  return null;
}

export default App;