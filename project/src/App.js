import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/homePage';
import Login from './components/login';
import Signup from './components/signup';

function App() {
  return(
    <Router>
      <Routes>
      <Route path="/" element={<Home/>} />
      <Route path='/login' element={<Login/>} />
      <Route path='/signup' element={<Signup/>} />
      </Routes>
    </Router>
  )
}

export default App;
