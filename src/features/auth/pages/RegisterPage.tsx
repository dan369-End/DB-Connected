import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { AuthLayout } from '../components/AuthLayout';

export const RegisterPage: React.FC = () => {
  const { signUp, isConfigured } = useAuth();
  const { navigate, resolvePostLoginNavigation } = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMsg('Cet email est déjà associé à un compte. Veuillez vous connecter.');
        } else {
          setErrorMsg(error.message || 'Une erreur est survenue lors de l\'inscription.');
        }
      } else {
        setSuccessMsg(
          'Compte créé avec succès ! Si la confirmation par e-mail est activée, veuillez vérifier votre boîte de réception pour valider votre compte.'
        );
        setPassword('');
        setConfirmPassword('');
        // Attempt post login navigation if auto-confirmed / session directly opened
        resolvePostLoginNavigation();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tagline="Commencez dès aujourd'hui votre parcours numérique."
      quote="Développez vos compétences, équipez-vous et saisissez de nouvelles opportunités professionnelles."
    >
      <div className="auth-card-inner">
        <div className="auth-header">
          <h1 className="auth-title">Créer votre compte</h1>
          <p className="auth-subtitle">Rejoignez l'écosystème DB-Connect.</p>
        </div>

        {!isConfigured && (
          <div className="auth-alert alert-warning">
            <strong>Configuration en attente :</strong>
            <br />
            Veuillez renseigner <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> pour activer l'authentification.
          </div>
        )}

        {errorMsg && (
          <div className="auth-alert alert-error" role="alert">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="auth-alert alert-success" role="status">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              Adresse email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="form-label">
              Mot de passe
            </label>
            <input
              id="register-password"
              type="password"
              required
              autoComplete="new-password"
              disabled={loading}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="form-hint">Au moins 6 caractères</span>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password" className="form-label">
              Confirmation du mot de passe
            </label>
            <input
              id="register-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              disabled={loading}
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Création en cours...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            Vous possédez déjà un compte ?{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate('login')}
              className="toggle-link-btn"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
