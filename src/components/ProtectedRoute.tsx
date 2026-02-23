import { Navigate } from 'react-router-dom';

// AUTHENTICATION TEMPORARILY DISABLED FOR DEVELOPMENT
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
