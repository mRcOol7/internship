import React, { useEffect } from "react";
import { Navigate,Outlet } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            toast.error("Please login to access Home page", {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        }
    }, [token]);

    if(!token){
        return <Navigate to="/login"  replace/>;
    }
    return(
        <Outlet />
    );
};

export default ProtectedRoute;