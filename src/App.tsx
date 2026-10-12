import React, { useEffect } from 'react';
import {
  AuthProvider,
  useAuth,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './features/auth';
import { NavigationProvider, useNavigation } from './hooks/useNavigation';
import { CartProvider } from './features/marketplace/context/CartContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardContentRouter } from './pages/DashboardContentRouter';
import { LandingPage } from './features/landing';

function MainAppShell() {
  const { user, isLoading } = useAuth();
  const {
    currentRoute,
    navigate,
    setReturnTo,
    isPrivateRoute,
  } = useNavigation();

  // Route protection and redirection management
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Unauthenticated visitor trying to access a protected private route
      if (typeof window !== 'undefined' && isPrivateRoute(window.location.pathname)) {
        setReturnTo(window.location.pathname + window.location.search);
        navigate('login');
      }
    } else {
      // Already authenticated user trying to access public auth entry pages
      if (['login', 'register', 'forgot_password'].includes(currentRoute)) {
        navigate('home');
      }
    }
  }, [user, isLoading, currentRoute, isPrivateRoute, navigate, setReturnTo]);

  // Loading state during initial session restoration
  if (isLoading) {
    return (
      <div className="app-boot-splash">
        <div className="spinner large" />
        <span className="boot-label">Chargement de DB-Connect...</span>
      </div>
    );
  }

  // Dedicated Auth Routes
  if (currentRoute === 'login') {
    if (user) {
      return (
        <DashboardLayout>
          <DashboardContentRouter />
        </DashboardLayout>
      );
    }
    return <LoginPage />;
  }

  if (currentRoute === 'register') {
    if (user) {
      return (
        <DashboardLayout>
          <DashboardContentRouter />
        </DashboardLayout>
      );
    }
    return <RegisterPage />;
  }

  if (currentRoute === 'forgot_password') {
    if (user) {
      return (
        <DashboardLayout>
          <DashboardContentRouter />
        </DashboardLayout>
      );
    }
    return <ForgotPasswordPage />;
  }

  if (currentRoute === 'reset_password') {
    return <ResetPasswordPage />;
  }

  // Unauthenticated visitor on root ('/')
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated user on private dashboard shell
  return (
    <DashboardLayout>
      <DashboardContentRouter />
    </DashboardLayout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <CartProvider>
          <MainAppShell />
        </CartProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
