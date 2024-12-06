import React, { useState } from "react";
import Navbar from "./navBar";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (password !== confirmPassword) {
            setMessage({ text: 'Passwords do not match', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/signup', { email, password });
            console.log(response); 
            setMessage({ 
                text: 'Sign up successful! You can now login.', 
                type: 'success' 
            });

            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        text: 'Registration successful! Please login with your credentials',
                        type: 'success'
                    }
                });
            }, 2000);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Sign up failed. Please try again.';
            setMessage({ 
                text: errorMsg, 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="signup-container">
                
                <div className="signup-form-container">
                    <form onSubmit={handleSubmit} className="signup-form">
                        <h2>Sign Up</h2>
                    
                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
            
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm your password"
                            minLength="6"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`signup-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing up...' : 'Sign Up'}
                    </button>

                    <p className="login-link">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    </div>
    );
};

export default Signup;