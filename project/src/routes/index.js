import React from "react";
import { BrowserRouter as Router,Routes, Route } from "react-router-dom";
import Home from "../components/homePage";
import Login from "../components/login";
import Signup from "../components/signup";
import TextEditor from "../components/TextEditor";
import ProtectedRoute from "../components/ProtectedRoute";
import InvoiceGenerator from "../components/InvoiceGenerator";

const AppRoutes = () => {
    return (
    <Router>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute />} >
              <Route path="/" element={<Home />} />
              <Route path="/editor" element={<TextEditor />} />
              <Route path="/invoice-generator" element={<InvoiceGenerator />} />
            </Route>
        </Routes>
    </Router>
    );
};

export default AppRoutes;