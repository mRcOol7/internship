import React, { useState } from "react";
import Navbar from "./navBar";
import { useNavigate } from "react-router-dom";
import api from "../api";
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await api.post('/api/login', {email, password});
            localStorage.setItem('token', response.data.token);
            setMessage({ text: 'Login successful!', type: 'success' });
            setTimeout(() => {
                navigate('/', {state:{sucessMessage:'Login successful'}});
                console.log('Login successful');
            }, 1500);
        }catch(error){
            const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
            setMessage({ text: errorMsg, type: 'error' });
            console.log(errorMsg);
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
                        Don't have an account? <a href="/signup">Sign up</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;