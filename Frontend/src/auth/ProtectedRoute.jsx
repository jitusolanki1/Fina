import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth() || {};
  const { initialized } = useAuth() || {};
  const location = useLocation();
  // if we haven't finished the initial auth check, don't redirect yet — avoid flashing to login
  if (initialized === false) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
