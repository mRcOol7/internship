import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () =>{
    return(
        <nav className="nav">
            <div className="nav-name">
                <h1>ESG</h1>
            </div> 
            <ul className="nav-list">
                <li className="nav-item">
                    <Link to="/">Home</Link>
                </li>
                <li className="nav-item">
                    <Link to="/login">login</Link>
                </li>
                <li className="nav-item">
                    <Link to="/signup">signup</Link>
                </li>
            </ul>
        </nav>
    );
};
    

export default Navbar;