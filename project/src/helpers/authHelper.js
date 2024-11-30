import { useNavigate } from "react-router-dom";
import api from "../api";

export const useAuth = () => {
    const navigate = useNavigate();

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/', {state:{sucessMessage:'Login successful'}});
            
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
        }
    };

    const signup = async (email, password) => {
        try {
            const response = await api.post('/api/signup', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/login',{state:{Text:'Sign up successful',sucessMessage:'Sign up successful'}});
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Sign up failed. Please try again.'); 
        }
    };

    return { login, signup };
};