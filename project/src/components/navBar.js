import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Logout successful');
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <h1>ESG</h1>
        </Link>
      </div>
      <ul className="nav-list">
        <li className={`nav-item ${isActive('/')}`}>
          <Link to="/">Home</Link>
        </li>
        <li className={`nav-item ${isActive('/editor')}`}>
          <Link to="/editor">Editor</Link>
        </li>
        <li className={`nav-item ${isActive('/invoice-generator')}`}>
          <Link to="/invoice-generator">Invoice</Link>
        </li>
        {!token ? (
          <>
            <li className={`nav-item ${isActive('/login')}`}>
              <Link to="/login">Login</Link>
            </li>
            <li className={`nav-item ${isActive('/signup')}`}>
              <Link to="/signup">Sign Up</Link>
            </li>
          </>
        ) : (
          <li className="nav-item">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;