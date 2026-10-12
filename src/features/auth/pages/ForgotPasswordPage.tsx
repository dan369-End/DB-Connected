import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { AuthLayout } from '../components/AuthLayout';
import { CheckCircleIcon } from '@/components/icons';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail, isConfigured } = useAuth();
  const { navigate } = useNavigation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse email.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMsg('Une erreur est survenue lors de l\'envoi du lien. Veuillez réessayer ultérieurement.');
      } else {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tagline="Récupérez l'accès à votre compte en toute sécurité."
      quote="Un lien de réinitialisation vous permet de définir un nouveau mot de passe rapidement."
    >
      <div className="auth-card-inner">
        <div className="auth-header">
          <h1 className="auth-title">Mot de passe oublié ?</h1>
          <p className="auth-subtitle">
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
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

        {submitted ? (
          <div className="auth-success-card" role="status">
            <div className="auth-success-icon-wrap">
              <CheckCircleIcon size={32} className="text-cyan-400" />
            </div>
            <h2 className="auth-success-title">Vérifiez votre boîte mail</h2>
            <p className="auth-success-text">
              Si un compte correspond à l'adresse <strong>{email}</strong>, un lien de réinitialisation vous a été envoyé.
            </p>
            <p className="auth-success-hint text-xs text-slate-400 mt-2">
              Pensez à vérifier vos spams ou courriers indésirables si vous ne recevez rien d'ici quelques instants.
            </p>
            <button
              type="button"
              className="auth-submit-btn mt-6"
              onClick={() => navigate('login')}
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                Adresse email
              </label>
              <input
                id="forgot-email"
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

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="btn-loading-content">
                  <span className="spinner" />
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer le lien'
              )}
            </button>
          </form>
        )}

        {!submitted && (
          <div className="auth-toggle">
            <p>
              Vous vous souvenez de votre mot de passe ?{' '}
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
