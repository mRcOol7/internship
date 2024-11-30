import React, { useState } from "react";
import Navbar from "./navBar";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setconfirmPassword] = useState('');
    const [message, setMessage] = useState({text:'',type:''});
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({text:'Passwords do not match',type:'error'});
            return;
        }
        try{
            const response = await api.post('/api/signup', {email, password});
            localStorage.setItem('token', response.data.token);
            setMessage({text:'Sign up successful',type:'success'});
            setTimeout(() => {
                navigate('/login', {state:{Text:'Sign up successful',sucessMessage:'Sign up successful'}});
                console.log('Sign up successful');
            }, 1500);
        }catch(error){
            const errorMsg = error.response?.data?.message || error.message || 'Sign up failed. Please try again.';
            setMessage({text:errorMsg,type:'error'});
            console.log(errorMsg);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="signup-container">
                <h2>Sign Up</h2>
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
                            placeholder="Choose a password"
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setconfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm your password"
                            error={password !== confirmPassword ? '<h1> Passwords do not match</h1>' : ''}           
                        />
                    </div>
                    <button type="submit">Sign Up</button>
                    <p>Already have an account? <a href="/login">Login</a></p>
                </form>
            </div>
        </div>
    );
};

export default Signup;