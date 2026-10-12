export { AuthProvider, useAuth } from './AuthContext';
export { AuthModalOrCard } from './AuthForm';
export { ProtectedRoute, RoleGuard } from './ProtectedRoute';
export { AuthLayout } from './components/AuthLayout';
export { AuthVisualPanel } from './components/AuthVisualPanel';
export { LoginPage } from './pages/LoginPage';
export { RegisterPage } from './pages/RegisterPage';
export { ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { ResetPasswordPage } from './pages/ResetPasswordPage';

export const AUTH_FEATURE_CONFIG = {
  id: 'auth',
  name: 'Authentification & Profils',
  status: 'active',
} as const;
