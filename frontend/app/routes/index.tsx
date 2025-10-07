import { Navigate } from 'react-router';
import { AuthStorage } from '../lib/auth';

export default function Index() {
  const isAuthenticated = AuthStorage.isAuthenticated();
  return <Navigate to={isAuthenticated ? '/todos' : '/auth'} replace />;
}
