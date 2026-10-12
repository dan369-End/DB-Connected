import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { AuthLayout } from '../components/AuthLayout';

export const LoginPage: React.FC = () => {
  const { signIn, isConfigured, sessionError } = useAuth();
  const { navigate, returnTo, resolvePostLoginNavigation } = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Email ou mot de passe incorrect.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Veuillez confirmer votre adresse email avant de vous connecter.');
        } else {
          setErrorMsg(error.message || 'Une erreur est survenue lors de la connexion.');
        }
      } else {
        // Successful login: resolve destination
        resolvePostLoginNavigation();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tagline="Un seul espace pour tous vos projets numériques."
      quote="Connectez-vous pour retrouver vos cours, vos commandes, vos demandes et vos opportunités."
    >
      <div className="auth-card-inner">
        <div className="auth-header">
          <h1 className="auth-title">Bon retour sur DB-Connect</h1>
          <p className="auth-subtitle">Connectez-vous pour accéder à votre espace.</p>
        </div>

        {returnTo && (
          <div className="auth-alert alert-info" role="status">
            Veuillez vous connecter pour accéder à cette section.
          </div>
        )}

        {!isConfigured && (
          <div className="auth-alert alert-warning">
            <strong>Configuration en attente :</strong>
            <br />
            Veuillez renseigner <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> pour activer l'authentification.
          </div>
        )}

        {sessionError && !errorMsg && (
          <div className="auth-alert alert-warning" role="alert">
            {sessionError}
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert alert-error" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Adresse email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              disabled={loading}
              className="form-input"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">
                Mot de passe
              </label>
              <button
                type="button"
                className="link-subtle-forgot"
                onClick={() => navigate('forgot_password')}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              disabled={loading}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner" />
                Connexion en cours...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            Vous n'avez pas encore de compte ?{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate('register')}
              className="toggle-link-btn"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
