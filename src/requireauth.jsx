// src/RequireAuth.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const RequireAuth = ({ children }) => {
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    // Login değilse redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};//not

export default RequireAuth;
