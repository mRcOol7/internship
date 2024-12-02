import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    useEffect(() => {
        if (!token) {
            const message = location.pathname.includes('editor') 
                ? "Please login to access the Editor"
                : "Please login to access this page";
                
            toast.error(message, {
                position: "bottom-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        }
    }, [token, location]);

    if(!token){
        return <Navigate to="/login" replace/>;
    }
    return(
        <Outlet />
    );
};

export default ProtectedRoute;