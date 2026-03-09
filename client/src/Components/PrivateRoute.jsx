import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn"); // Check login flag

  if (!isLoggedIn) {
    return <Navigate to="/login" />; // Redirect if not logged in
  }

  return children; // Show children (Home) if logged in
};

export default PrivateRoute;
