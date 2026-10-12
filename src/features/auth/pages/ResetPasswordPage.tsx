import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { AuthLayout } from '../components/AuthLayout';
import { CheckCircleIcon } from '@/components/icons';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword, isConfigured } = useAuth();
  const { navigate } = useNavigation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || !confirmPassword) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMsg(error.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.');
      } else {
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tagline="Sécurisez l'accès à votre espace DB-Connect."
      quote="Choisissez un nouveau mot de passe robuste pour protéger vos données et vos activités."
    >
      <div className="auth-card-inner">
        <div className="auth-header">
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">
            Définissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
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

        {success ? (
          <div className="auth-success-card" role="status">
            <div className="auth-success-icon-wrap">
              <CheckCircleIcon size={32} className="text-cyan-400" />
            </div>
            <h2 className="auth-success-title">Mot de passe mis à jour !</h2>
            <p className="auth-success-text">
              Votre mot de passe a été modifié avec succès. Vous pouvez désormais vous connecter avec vos nouveaux identifiants.
            </p>
            <button
              type="button"
              className="auth-submit-btn mt-6"
              onClick={() => navigate('login')}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-new-password" className="form-label">
                Nouveau mot de passe
              </label>
              <input
                id="reset-new-password"
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
              <label htmlFor="reset-confirm-password" className="form-label">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="reset-confirm-password"
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
                  Mise à jour...
                </span>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="auth-toggle">
            <p>
              <button
                type="button"
                disabled={loading}
                onClick={() => navigate('login')}
                className="toggle-link-btn"
              >
                Retour à la connexion
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
