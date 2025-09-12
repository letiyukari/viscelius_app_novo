// src/routes/RequireRole.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente de proteção de rota por role
 * @param {object} props
 * @param {React.ReactNode} props.children Conteúdo da rota
 * @param {string|null} props.userRole Role atual do usuário (patient | therapist)
 * @param {string} props.requiredRole Role necessária para acessar a rota
 * @param {string} props.redirectTo Rota para redirecionar caso não autorizado
 */
const RequireRole = ({ children, userRole, requiredRole, redirectTo }) => {
  if (!userRole) {
    // ainda não carregou role -> pode mostrar um loading, mas aqui simplificamos
    return <div>Carregando...</div>;
  }

  if (userRole !== requiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
