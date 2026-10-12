import React, { useState } from 'react';
import { useAuth } from '@/features/auth';
import { UserAvatar } from '@/components/UserAvatar';
import { CloseIcon, CheckCircleIcon } from '@/components/icons';
import { RoleBadge, ROLE_LABELS } from './RoleBadge';
import { addUserRole, removeUserRole } from '../adminService';
import type { AdminUserRecord, UserRoleName } from '@/types';

interface UserDetailModalProps {
  user: AdminUserRecord;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const ALL_ROLES: UserRoleName[] = [
  'user',
  'academy_admin',
  'marketplace_admin',
  'services_admin',
  'editor',
  'super_admin',
];

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const { user: currentAuthUser } = useAuth();

  const [selectedNewRole, setSelectedNewRole] = useState<UserRoleName>('academy_admin');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Confirmation state for role removal
  const [roleToRemove, setRoleToRemove] = useState<UserRoleName | null>(null);

  if (!isOpen) return null;

  const isSelf = currentAuthUser?.id === user.id;

  // Determine which roles are available to be added
  const availableRolesToAdd = ALL_ROLES.filter((r) => !user.roles.includes(r));

  const handleAddRole = async () => {
    if (!selectedNewRole) return;
    setIsAddingRole(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await addUserRole(user.id, selectedNewRole);
    if (!res.success) {
      setActionError(res.error || 'Impossible d’attribuer ce rôle.');
    } else {
      setActionSuccess(`Le rôle "${ROLE_LABELS[selectedNewRole]}" a été attribué avec succès.`);
      onUserUpdated();
    }
    setIsAddingRole(false);
  };

  const handleConfirmRemoveRole = async () => {
    if (!roleToRemove) return;
    setIsRemovingRole(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await removeUserRole(user.id, roleToRemove);
    if (!res.success) {
      setActionError(res.error || 'Impossible de retirer ce rôle.');
    } else {
      setActionSuccess(`Le rôle "${ROLE_LABELS[roleToRemove]}" a été retiré.`);
      setRoleToRemove(null);
      onUserUpdated();
    }
    setIsRemovingRole(false);
  };

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Date inconnue';

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !roleToRemove) {
          onClose();
        }
      }}
    >
      <div
        className="modal-container"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Fiche Utilisateur & Rôles
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Supervision des informations et gouvernance des autorisations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Messages */}
          {actionError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircleIcon size={16} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* User Profile Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(11, 15, 25, 0.5)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <UserAvatar
              avatarUrl={user.avatar_url}
              fullName={user.full_name}
              email={user.email}
              size={52}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.full_name || 'Utilisateur sans nom'}
                </h4>
                {isSelf && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--color-accent)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    Votre compte
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.2rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.85rem',
              fontSize: '0.825rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(11, 15, 25, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                Téléphone
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {user.phone || 'Non renseigné'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(11, 15, 25, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                WhatsApp
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {user.whatsapp || 'Non renseigné'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(11, 15, 25, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                Ville
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {user.city || 'Non renseignée'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(11, 15, 25, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                Inscrit le
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Section: Roles Management */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Rôles actifs ({user.roles.length})
              </h5>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Gouvernance RBAC
              </span>
            </div>

            {/* Roles Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {user.roles.map((role) => {
                // Rule 12: Never propose removing 'user'
                const isBaseUser = role === 'user';
                // Rule 12: Don't allow current super_admin to remove their own super_admin role visually
                const isOwnSuperAdmin = isSelf && role === 'super_admin';
                const canRemove = !isBaseUser && !isOwnSuperAdmin;

                return (
                  <RoleBadge
                    key={role}
                    role={role}
                    size="md"
                    canRemove={canRemove}
                    onRemove={() => setRoleToRemove(role)}
                  />
                );
              })}
            </div>

            {/* Notice if attempting to remove protected roles */}
            {isSelf && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Protection de sécurité : vous ne pouvez pas retirer votre propre rôle Super Admin.
              </p>
            )}

            {/* Add Role Subsection */}
            {availableRolesToAdd.length > 0 && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(11, 15, 25, 0.4)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  Attribuer un nouveau rôle
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value as UserRoleName)}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-main)',
                      fontSize: '0.825rem',
                    }}
                  >
                    {availableRolesToAdd.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn-admin-cta primary"
                    onClick={handleAddRole}
                    disabled={isAddingRole}
                    style={{ padding: '0.55rem 1rem', fontSize: '0.825rem' }}
                  >
                    {isAddingRole ? 'Attribution...' : 'Attribuer le rôle'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(11, 15, 25, 0.3)',
          }}
        >
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Role Removal */}
      {roleToRemove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '420px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Retirer ce rôle ?
            </h4>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              L'utilisateur perdra les permissions associées au rôle{' '}
              <strong style={{ color: 'var(--color-accent)' }}>
                {ROLE_LABELS[roleToRemove] || roleToRemove}
              </strong>.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                className="btn-admin-cta secondary"
                onClick={() => setRoleToRemove(null)}
                disabled={isRemovingRole}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmRemoveRole}
                disabled={isRemovingRole}
                style={{
                  padding: '0.65rem 1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  transition: 'all 0.15s ease',
                }}
              >
                {isRemovingRole ? 'Retrait...' : 'Retirer le rôle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
