import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Não está autenticado, redirecionar para login
    return <Navigate to="/login" replace />;
  }

  // Está autenticado, renderizar o componente filho
  return <>{children}</>;
};

export default ProtectedRoute;