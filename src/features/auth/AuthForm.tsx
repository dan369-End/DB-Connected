import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { CloseIcon } from '@/components/icons';

export interface AuthModalOrCardProps {
  initialMode?: 'signin' | 'signup';
  onClose?: () => void;
  isModal?: boolean;
  noticeMessage?: string | null;
  onSuccess?: () => void;
}

export const AuthModalOrCard: React.FC<AuthModalOrCardProps> = ({
  initialMode = 'signin',
  onClose,
  isModal = false,
  noticeMessage = null,
  onSuccess,
}) => {
  const { signIn, signUp, isConfigured, sessionError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const resetForm = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
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
          onSuccess?.();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrorMsg('Cet email est déjà associé à un compte. Veuillez vous connecter.');
          } else {
            setErrorMsg(error.message || 'Une erreur est survenue lors de l\'inscription.');
          }
        } else {
          setSuccessMsg(
            'Compte créé avec succès ! Si la confirmation par email est activée, veuillez vérifier votre boîte de réception pour valider votre compte.'
          );
          setPassword('');
          setConfirmPassword('');
          onSuccess?.();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div
      className={`auth-card ${isModal ? 'is-in-modal' : ''}`}
      onClick={(e) => isModal && e.stopPropagation()}
    >
      {onClose && (
        <button
          type="button"
          className="auth-modal-close-btn"
          onClick={onClose}
          aria-label="Fermer"
        >
          <CloseIcon size={18} />
        </button>
      )}

      <div className="auth-header">
        <h2 className="auth-title">
          {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Accédez à votre espace DB-Connect'
            : 'Rejoignez la plateforme DB-Connect'}
        </p>
      </div>

      {!isConfigured && (
        <div className="auth-alert alert-warning">
          <strong>Variables d'environnement en attente :</strong>
          <br />
          Veuillez configurer <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> dans votre environnement pour activer l'authentification.
        </div>
      )}

      {sessionError && !errorMsg && (
        <div className="auth-alert alert-warning" role="alert">
          {sessionError}
        </div>
      )}

      {noticeMessage && !errorMsg && !successMsg && (
        <div className="auth-alert alert-info" role="status">
          {noticeMessage}
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
          <label htmlFor="auth-email" className="form-label">
            Adresse email
          </label>
          <input
            id="auth-email"
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
          <label htmlFor="auth-password" className="form-label">
            Mot de passe
          </label>
          <input
            id="auth-password"
            type="password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            disabled={loading}
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === 'signup' && (
            <span className="form-hint">Au moins 6 caractères</span>
          )}
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="auth-confirm-password" className="form-label">
              Confirmation du mot de passe
            </label>
            <input
              id="auth-confirm-password"
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
        )}

        <button
          type="submit"
          disabled={loading || !isConfigured}
          className="auth-submit-btn"
        >
          {loading ? (
            <span className="btn-loading-content">
              <span className="spinner"></span>
              {mode === 'signin' ? 'Connexion en cours...' : 'Création en cours...'}
            </span>
          ) : mode === 'signin' ? (
            'Se connecter'
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <div className="auth-toggle">
        {mode === 'signin' ? (
          <p>
            Vous n'avez pas encore de compte ?{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => resetForm('signup')}
              className="toggle-link-btn"
            >
              Créer un compte
            </button>
          </p>
        ) : (
          <p>
            Vous possédez déjà un compte ?{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => resetForm('signin')}
              className="toggle-link-btn"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );

  if (isModal || onClose) {
    return (
      <div
        className="modal-backdrop auth-modal-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
};
