import { useNavigate } from "react-router-dom";
import api from "../api";

export const useAuth = () => {
    const navigate = useNavigate();

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/login', { email, password });
            const token = response.data.token;

            if (!token) {
                throw new Error('Invalid token received. Please try again.');
            }

            localStorage.setItem('token', token);
            navigate('/', { state: { successMessage: 'Login successful' } });
        } catch (error) {
            console.error('Login Error:', error.message);
            throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    const signup = async (email, password) => {
        try {
            const response = await api.post('/api/signup', { email, password });
            const token = response.data.token;

            if (!token) {
                throw new Error('Invalid token received. Please try again.');
            }

            localStorage.setItem('token', token);
            navigate('/login', { state: { successMessage: 'Sign up successful' } });
        } catch (error) {
            console.error('Signup Error:', error.message);
            throw new Error(error.response?.data?.message || 'Sign up failed. Please try again.');
        }
    };

    const saveContent = async (text) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('User is not authenticated. Please log in.');
            }

            const response = await api.post('/api/save-content', { text }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Text saved successfully', response.data);
        } catch (error) {
            console.error('Error saving text:', error.message);
            throw new Error(error.response?.data?.message || 'Failed to save content. Please try again.');
        }
    };

    return { login, signup, saveContent };
};
