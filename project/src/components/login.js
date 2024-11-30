import React, { useState } from "react";
import Navbar from "./navBar";
import { Link } from "react-router-dom";
import { useAuth } from "../helpers/authHelper";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const {login} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            await login(email, password);
            setMessage({ text: 'Login successful', type: 'success' });
            console.log('Login successful');
        }catch(error){
            setMessage({ text: error.response?.data?.message || error.message || 'Login failed. Please try again.', type: 'error' });
            console.log(error.response?.data?.message || error.message || 'Login failed. Please try again.');
            console.log(error);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="login-container">
                <h2>Login</h2>
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            about="email"
                            error="Please enter a valid email address"
                            pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                            title="Please enter a valid email address"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit">Login</button>
                    <p>
                        Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;