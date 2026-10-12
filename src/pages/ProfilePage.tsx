import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useNavigation } from '@/hooks/useNavigation';
import {
  getProfileAvatarSignedUrl,
  uploadProfileAvatar,
  deleteProfileAvatar,
  validateAvatarFile,
} from '@/utils/avatarStorage';
import {
  AcademyIcon,
  MarketplaceIcon,
  ServicesIcon,
  OpportunitiesIcon,
  MessageIcon,
  CheckCircleIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
  UploadIcon,
  CalendarIcon,
  LocationIcon,
  PhoneIcon,
  LogoutIcon,
} from '@/components/icons';

export const ProfilePage: React.FC = () => {
  const {
    user,
    profile,
    primaryRole,
    refreshProfile,
    updatePassword,
    resetPasswordForEmail,
    signOut,
  } = useAuth();
  const { navigate } = useNavigation();

  // Avatar Management State
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Personal Information Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [city, setCity] = useState(profile?.city || '');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);

  // Activity Counts State (Real numbers from Supabase)
  const [activityCounts, setActivityCounts] = useState({
    courses: 0,
    orders: 0,
    requests: 0,
    applications: 0,
  });
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Password Update State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [resetLinkSuccess, setResetLinkSuccess] = useState<string | null>(null);

  // Synchronize Personal Information fields when profile changes and not actively editing
  useEffect(() => {
    if (!isEditingInfo && profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setCity(profile.city || '');
    }
  }, [profile, isEditingInfo]);

  // Resolve signed URL for private avatar
  useEffect(() => {
    let isCancelled = false;

    if (profile?.avatar_url) {
      getProfileAvatarSignedUrl(profile.avatar_url).then((url) => {
        if (!isCancelled) {
          setAvatarSignedUrl(url);
        }
      });
    } else {
      setAvatarSignedUrl(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [profile?.avatar_url]);

  // Fetch real activity counts strictly for user.id
  const loadActivityCounts = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setLoadingActivity(true);

    try {
      const [coursesRes, ordersRes, requestsRes, appsRes] = await Promise.all([
        supabase
          .from('academy_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('marketplace_orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('contact_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('opportunity_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      setActivityCounts({
        courses: coursesRes.count || 0,
        orders: ordersRes.count || 0,
        requests: requestsRes.count || 0,
        applications: appsRes.count || 0,
      });
    } catch (err) {
      console.warn('[DB-Connect Profile] Error loading activity counts:', err);
    } finally {
      setLoadingActivity(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActivityCounts();
  }, [loadActivityCounts]);

  // Avatar Selection & Preview Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Fichier non supporté.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPreviewFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Cancel Preview
  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm Avatar Upload & Replacement
  const handleConfirmAvatarUpload = async () => {
    if (!user?.id || !previewFile || !supabase) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    const oldPath = profile?.avatar_url;

    try {
      // 1. Upload new image
      const uploadRes = await uploadProfileAvatar(user.id, previewFile);
      if (!uploadRes.success || !uploadRes.path) {
        setAvatarError(uploadRes.error || "Échec du téléversement de l'image.");
        setIsUploadingAvatar(false);
        return;
      }

      const newPath = uploadRes.path;

      // 2. Update DB profile with internal Storage path
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: newPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        // If DB update fails, delete newly uploaded orphaned file to avoid waste
        await deleteProfileAvatar(newPath);
        setAvatarError("Impossible d'enregistrer l'avatar dans votre profil.");
        setIsUploadingAvatar(false);
        return;
      }

      // 3. Delete old file from Storage if different
      if (oldPath && oldPath !== newPath) {
        await deleteProfileAvatar(oldPath);
      }

      // 4. Refresh auth profile
      await refreshProfile();

      // Clean preview states
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setAvatarSuccess('Photo de profil mise à jour avec succès.');
    } catch (err) {
      console.warn('[DB-Connect Profile] Avatar upload error:', err);
      setAvatarError("Une erreur inattendue est survenue lors de l'enregistrement.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Delete Avatar
  const handleConfirmDeleteAvatar = async () => {
    if (!user?.id || !supabase) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    const oldPath = profile?.avatar_url;

    try {
      // 1. Delete object from storage
      if (oldPath) {
        await deleteProfileAvatar(oldPath);
      }

      // 2. Set avatar_url = null in DB
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        setAvatarError("Impossible de supprimer l'avatar de votre profil.");
        setIsUploadingAvatar(false);
        setIsDeleteConfirmOpen(false);
        return;
      }

      // 3. Refresh auth state
      await refreshProfile();
      setAvatarSignedUrl(null);
      setIsDeleteConfirmOpen(false);
      setAvatarSuccess('Photo de profil supprimée.');
    } catch (err) {
      console.warn('[DB-Connect Profile] Avatar delete error:', err);
      setAvatarError('Erreur lors de la suppression.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save Personal Details
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !supabase) return;

    if (!fullName.trim()) {
      setInfoError('Le nom complet est obligatoire.');
      return;
    }

    setInfoSaving(true);
    setInfoError(null);
    setInfoSuccess(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          city: city.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        setInfoError(error.message || 'Impossible de mettre à jour vos informations.');
      } else {
        await refreshProfile();
        setIsEditingInfo(false);
        setInfoSuccess('Informations personnelles mises à jour avec succès.');
      }
    } catch (err) {
      console.warn('[DB-Connect Profile] Update info error:', err);
      setInfoError('Une erreur inattendue est survenue.');
    } finally {
      setInfoSaving(false);
    }
  };

  // Cancel Personal Details Edit
  const handleCancelEditInfo = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setCity(profile.city || '');
    }
    setInfoError(null);
    setIsEditingInfo(false);
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await updatePassword(newPassword);
      if (res.error) {
        setPasswordError(res.error.message || 'Impossible de modifier le mot de passe.');
      } else {
        setPasswordSuccess('Votre mot de passe a été modifié avec succès.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Une erreur est survenue.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Send Password Reset Link
  const handleSendResetLink = async () => {
    if (!user?.email) return;
    setIsSendingResetLink(true);
    setResetLinkSuccess(null);
    setPasswordError(null);

    try {
      const res = await resetPasswordForEmail(user.email);
      if (res.error) {
        setPasswordError(res.error.message || "Impossible d'envoyer le lien.");
      } else {
        setResetLinkSuccess(`Un lien de réinitialisation a été envoyé à ${user.email}.`);
      }
    } catch {
      setPasswordError("Une erreur est survenue lors de l'envoi.");
    } finally {
      setIsSendingResetLink(false);
    }
  };

  // Initial letter fallback
  const displayInitial = (
    profile?.full_name?.trim().charAt(0) ||
    user?.email?.trim().charAt(0) ||
    'U'
  ).toUpperCase();

  // Formatted date (no raw UUID)
  const formattedCreationDate = user?.created_at || profile?.created_at
    ? new Date(user?.created_at || profile?.created_at || '').toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="profile-v1-shell">
      {/* Page Header */}
      <div className="profile-v1-header">
        <h1 className="profile-v1-title">Mon profil</h1>
        <p className="profile-v1-subtitle">
          Consultez et gérez vos informations personnelles, votre activité et la sécurité de votre compte.
        </p>
      </div>

      {/* Main 2-Columns Layout */}
      <div className="profile-v1-main-grid">
        {/* ========================================================
            LEFT COLUMN : A. IDENTITÉ & B. INFORMATIONS PERSONNELLES
           ======================================================== */}
        <div className="profile-v1-col">
          {/* ZONE A : IDENTITÉ & AVATAR */}
          <section className="profile-v1-panel" aria-label="Identité et photo de profil">
            <div className="profile-panel-header">
              <h2 className="profile-panel-title">Identité</h2>
              <span className={`sidebar-role-badge role-${primaryRole}`}>
                {primaryRole}
              </span>
            </div>

            {avatarError && (
              <div className="auth-alert alert-error" role="alert">
                {avatarError}
              </div>
            )}

            {avatarSuccess && (
              <div className="auth-alert alert-success" role="alert">
                <CheckCircleIcon size={16} />
                <span>{avatarSuccess}</span>
              </div>
            )}

            <div className="profile-identity-top">
              {/* Avatar Picture / Initial Fallback */}
              <div className="profile-avatar-big-wrap">
                {previewUrl ? (
                  <img src={previewUrl} alt="Aperçu du nouvel avatar" />
                ) : avatarSignedUrl ? (
                  <img
                    src={avatarSignedUrl}
                    alt={profile?.full_name || 'Photo de profil'}
                    onError={() => setAvatarSignedUrl(null)}
                  />
                ) : (
                  <span>{displayInitial}</span>
                )}
              </div>

              {/* Identity Details */}
              <div className="profile-identity-info">
                <h3 className="profile-identity-name">
                  {profile?.full_name || 'Utilisateur DB-Connect'}
                </h3>
                <p className="profile-identity-email">{user?.email}</p>

                <div className="profile-identity-meta">
                  {profile?.city && (
                    <span className="profile-meta-tag">
                      <LocationIcon size={12} />
                      <span>{profile.city}</span>
                    </span>
                  )}
                  {formattedCreationDate && (
                    <span className="profile-meta-tag">
                      <CalendarIcon size={12} />
                      <span>Membre depuis le {formattedCreationDate}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Action Banner if user picked a new file */}
            {previewUrl && (
              <div className="avatar-preview-banner">
                <span className="avatar-preview-banner-text">
                  Aperçu de la nouvelle photo. Confirmez pour l'enregistrer.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-admin-cta primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={handleConfirmAvatarUpload}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Enregistrement...' : 'Valider cette photo'}
                  </button>
                  <button
                    type="button"
                    className="btn-admin-cta secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={handleCancelPreview}
                    disabled={isUploadingAvatar}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Avatar Management Actions */}
            <div className="profile-avatar-actions-row">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <button
                type="button"
                className="btn-avatar-action"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <UploadIcon size={14} />
                <span>
                  {profile?.avatar_url ? 'Remplacer la photo' : 'Ajouter une photo'}
                </span>
              </button>

              {profile?.avatar_url && !previewUrl && (
                <button
                  type="button"
                  className="btn-avatar-action danger"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isUploadingAvatar}
                >
                  <TrashIcon size={14} />
                  <span>Supprimer la photo</span>
                </button>
              )}
            </div>
          </section>

          {/* ZONE B : INFORMATIONS PERSONNELLES */}
          <section className="profile-v1-panel" aria-label="Informations personnelles">
            <div className="profile-panel-header">
              <h2 className="profile-panel-title">Informations personnelles</h2>
              {!isEditingInfo && (
                <button
                  type="button"
                  className="btn-avatar-action"
                  onClick={() => {
                    setInfoError(null);
                    setInfoSuccess(null);
                    setIsEditingInfo(true);
                  }}
                >
                  <EditIcon size={14} />
                  <span>Modifier mes informations</span>
                </button>
              )}
            </div>

            {infoError && (
              <div className="auth-alert alert-error" role="alert">
                {infoError}
              </div>
            )}

            {infoSuccess && (
              <div className="auth-alert alert-success" role="alert">
                <CheckCircleIcon size={16} />
                <span>{infoSuccess}</span>
              </div>
            )}

            {isEditingInfo ? (
              /* Edit Form */
              <form onSubmit={handleSaveInfo} className="profile-form-grid">
                <div className="profile-form-group full-width">
                  <label className="profile-form-label" htmlFor="edit-fullname">
                    Nom complet *
                  </label>
                  <input
                    id="edit-fullname"
                    type="text"
                    required
                    className="profile-form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex : Marie Dupont"
                    disabled={infoSaving}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="edit-phone">
                    Téléphone
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    className="profile-form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex : +242 06 000 0000"
                    disabled={infoSaving}
                  />
                  <span className="profile-form-hint">Numéro d'appel usuel</span>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="edit-whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="edit-whatsapp"
                    type="tel"
                    className="profile-form-input"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex : +242 06 000 0000"
                    disabled={infoSaving}
                  />
                  <span className="profile-form-hint">Pour les échanges directs</span>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="edit-city">
                    Ville
                  </label>
                  <input
                    id="edit-city"
                    type="text"
                    className="profile-form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Brazzaville, Pointe-Noire..."
                    disabled={infoSaving}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="edit-email-locked">
                    Adresse email
                  </label>
                  <input
                    id="edit-email-locked"
                    type="email"
                    disabled
                    className="profile-form-input"
                    value={user?.email || ''}
                  />
                  <span className="profile-form-hint">Gérée par Supabase Auth</span>
                </div>

                <div className="profile-form-actions-row full-width">
                  <button
                    type="submit"
                    className="btn-admin-cta primary"
                    disabled={infoSaving}
                  >
                    {infoSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    className="btn-admin-cta secondary"
                    onClick={handleCancelEditInfo}
                    disabled={infoSaving}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              /* Read-Only View */
              <div className="profile-form-grid">
                <div className="profile-form-group full-width">
                  <span className="profile-form-label">Nom complet</span>
                  <div className="profile-view-field-box">
                    {profile?.full_name || 'Non renseigné'}
                  </div>
                </div>

                <div className="profile-form-group">
                  <span className="profile-form-label">Téléphone</span>
                  <div className="profile-view-field-box font-mono">
                    {profile?.phone || 'Non renseigné'}
                  </div>
                </div>

                <div className="profile-form-group">
                  <span className="profile-form-label">WhatsApp</span>
                  <div className="profile-view-field-box font-mono">
                    {profile?.whatsapp || 'Non renseigné'}
                  </div>
                </div>

                <div className="profile-form-group">
                  <span className="profile-form-label">Ville</span>
                  <div className="profile-view-field-box">
                    {profile?.city || 'Non renseignée'}
                  </div>
                </div>

                <div className="profile-form-group">
                  <span className="profile-form-label">Adresse email</span>
                  <div className="profile-view-field-box font-mono">
                    {user?.email || '—'}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ========================================================
            RIGHT COLUMN : C. MON ACTIVITÉ & D. SÉCURITÉ DU COMPTE
           ======================================================== */}
        <div className="profile-v1-col">
          {/* ZONE C : MON ACTIVITÉ & RACCOURCIS */}
          <section className="profile-v1-panel" aria-label="Mon activité et raccourcis">
            <div className="profile-panel-header">
              <h2 className="profile-panel-title">Mon activité</h2>
            </div>

            {/* Real Activity Stats */}
            <div className="profile-activity-stats-grid">
              <div
                className="profile-activity-stat-box"
                onClick={() => navigate('academy')}
                role="button"
                tabIndex={0}
                title="Accéder à mes formations"
              >
                <span className="profile-stat-count">
                  {loadingActivity ? '—' : activityCounts.courses}
                </span>
                <span className="profile-stat-label">Formations</span>
              </div>

              <div
                className="profile-activity-stat-box"
                onClick={() => navigate('marketplace_orders')}
                role="button"
                tabIndex={0}
                title="Accéder à mes commandes"
              >
                <span className="profile-stat-count">
                  {loadingActivity ? '—' : activityCounts.orders}
                </span>
                <span className="profile-stat-label">Commandes</span>
              </div>

              <div
                className="profile-activity-stat-box"
                onClick={() => navigate('requests')}
                role="button"
                tabIndex={0}
                title="Accéder à mes demandes"
              >
                <span className="profile-stat-count">
                  {loadingActivity ? '—' : activityCounts.requests}
                </span>
                <span className="profile-stat-label">Demandes</span>
              </div>

              <div
                className="profile-activity-stat-box"
                onClick={() => navigate('opportunities_applications')}
                role="button"
                tabIndex={0}
                title="Accéder à mes candidatures"
              >
                <span className="profile-stat-count">
                  {loadingActivity ? '—' : activityCounts.applications}
                </span>
                <span className="profile-stat-label">Candidatures</span>
              </div>
            </div>

            {/* Shortcuts to existing user hubs */}
            <div className="profile-shortcuts-grid">
              <button
                type="button"
                className="profile-shortcut-card"
                onClick={() => navigate('academy')}
              >
                <div className="shortcut-left">
                  <div className="shortcut-icon-wrap">
                    <AcademyIcon size={18} />
                  </div>
                  <span className="shortcut-title">Mes formations</span>
                </div>
              </button>

              <button
                type="button"
                className="profile-shortcut-card"
                onClick={() => navigate('marketplace_orders')}
              >
                <div className="shortcut-left">
                  <div className="shortcut-icon-wrap">
                    <MarketplaceIcon size={18} />
                  </div>
                  <span className="shortcut-title">Mes commandes</span>
                </div>
              </button>

              <button
                type="button"
                className="profile-shortcut-card"
                onClick={() => navigate('requests')}
              >
                <div className="shortcut-left">
                  <div className="shortcut-icon-wrap">
                    <MessageIcon size={18} />
                  </div>
                  <span className="shortcut-title">Mes demandes</span>
                </div>
              </button>

              <button
                type="button"
                className="profile-shortcut-card"
                onClick={() => navigate('opportunities_applications')}
              >
                <div className="shortcut-left">
                  <div className="shortcut-icon-wrap">
                    <OpportunitiesIcon size={18} />
                  </div>
                  <span className="shortcut-title">Mes candidatures</span>
                </div>
              </button>
            </div>
          </section>

          {/* ZONE D : SÉCURITÉ DU COMPTE */}
          <section className="profile-v1-panel" aria-label="Sécurité du compte">
            <div className="profile-panel-header">
              <h2 className="profile-panel-title">Sécurité</h2>
            </div>

            <div className="security-info-line">
              <span className="security-info-label">Email de connexion :</span>
              <span className="security-info-val">{user?.email}</span>
            </div>

            {passwordError && (
              <div className="auth-alert alert-error" role="alert">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="auth-alert alert-success" role="alert">
                <CheckCircleIcon size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {resetLinkSuccess && (
              <div className="auth-alert alert-success" role="alert">
                <CheckCircleIcon size={16} />
                <span>{resetLinkSuccess}</span>
              </div>
            )}

            {/* Password Update Form */}
            <form onSubmit={handleUpdatePassword} className="security-password-box">
              <h3 className="security-password-title">Modifier mon mot de passe</h3>

              <div className="profile-form-group">
                <label className="profile-form-label" htmlFor="new-pass-field">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-pass-field"
                  type="password"
                  required
                  minLength={6}
                  className="profile-form-input"
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label" htmlFor="confirm-pass-field">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-pass-field"
                  type="password"
                  required
                  minLength={6}
                  className="profile-form-input"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="submit"
                  className="btn-admin-cta primary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>

                <button
                  type="button"
                  className="btn-avatar-action"
                  onClick={handleSendResetLink}
                  disabled={isSendingResetLink}
                  title="Recevoir un lien par email pour réinitialiser le mot de passe"
                >
                  {isSendingResetLink ? 'Envoi...' : 'Envoyer un lien par email'}
                </button>
              </div>
            </form>

            {/* Footer Row: Account Created & Sign Out */}
            <div className="security-footer-row">
              {formattedCreationDate && (
                <span className="security-created-date">
                  Compte créé le {formattedCreationDate}
                </span>
              )}

              <button
                type="button"
                className="btn-avatar-action danger"
                onClick={() => signOut()}
                title="Se déconnecter de DB-Connect"
              >
                <LogoutIcon size={14} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modal for Avatar Deletion */}
      {isDeleteConfirmOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => !isUploadingAvatar && setIsDeleteConfirmOpen(false)}
        >
          <div
            className="admin-modal-box"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <h3 className="modal-title">Supprimer la photo de profil ?</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isUploadingAvatar}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Cette action supprimera définitivement votre photo de profil. Votre avatar sera alors remplacé par vos initiales.
            </div>

            <div className="admin-modal-actions" style={{ padding: '1rem 1.5rem' }}>
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isUploadingAvatar}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-admin-cta"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                onClick={handleConfirmDeleteAvatar}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
