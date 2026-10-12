import React, { useState, useMemo } from 'react';
import { UserAvatar } from '@/components/UserAvatar';
import { SearchIcon, CloseIcon } from '@/components/icons';
import { RoleBadge, ROLE_LABELS } from './RoleBadge';
import { UserDetailModal } from './UserDetailModal';
import type { AdminUserRecord, UserRoleName } from '@/types';

interface UsersTabProps {
  users: AdminUserRecord[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
}

type RoleFilterOption = 'all' | UserRoleName;

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  loading,
  error,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterOption>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered & searched users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all') {
        if (!u.roles.includes(roleFilter)) return false;
      }

      // Search query filter (nom, email, telephone)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = (u.full_name || '').toLowerCase().includes(query);
        const matchEmail = (u.email || '').toLowerCase().includes(query);
        const matchPhone = (u.phone || '').toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const handleOpenUser = (u: AdminUserRecord) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleUserUpdated = () => {
    onRefresh();
    // Also update selectedUser if still in state
    if (selectedUser) {
      const refreshed = users.find((u) => u.id === selectedUser.id);
      if (refreshed) {
        setSelectedUser(refreshed);
      }
    }
  };

  const roleFilterTabs: Array<{ id: RoleFilterOption; label: string }> = [
    { id: 'all', label: 'Tous' },
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'academy_admin', label: 'Admin Académie' },
    { id: 'marketplace_admin', label: 'Admin Marketplace' },
    { id: 'services_admin', label: 'Admin Services' },
    { id: 'editor', label: 'Éditeur' },
    { id: 'user', label: 'Utilisateurs' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar: Search & Counts */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Gestion des Utilisateurs & Rôles
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {loading
                ? 'Chargement des comptes...'
                : `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''} affiché${filteredUsers.length > 1 ? 's' : ''} sur ${users.length} au total`}
            </p>
          </div>

          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={onRefresh}
            disabled={loading}
            style={{ fontSize: '0.825rem' }}
          >
            {loading ? 'Actualisation...' : 'Actualiser la liste'}
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'inline-flex',
              pointerEvents: 'none',
            }}
          >
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou numéro de téléphone..."
            style={{
              width: '100%',
              padding: '0.65rem 2.5rem 0.65rem 2.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(11, 15, 25, 0.6)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-main)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
              }}
              aria-label="Effacer la recherche"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Role Filters Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            paddingTop: '0.25rem',
          }}
        >
          <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Filtrer par rôle :
          </span>
          {roleFilterTabs.map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="spinner large" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Chargement des comptes utilisateurs via RPC sécurisée...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Aucun utilisateur trouvé
          </h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Aucun compte ne correspond aux filtres ou à la recherche courante.
          </p>
          {(searchQuery || roleFilter !== 'all') && (
            <button
              type="button"
              className="btn-admin-cta secondary"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="admin-table-card" style={{ display: 'none' }} id="admin-desktop-table">
            <style>
              {`
                @media (min-width: 768px) {
                  #admin-desktop-table { display: block !important; }
                  #admin-mobile-cards { display: none !important; }
                }
              `}
            </style>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Utilisateur</th>
                  <th style={{ width: '22%' }}>Contact</th>
                  <th style={{ width: '26%' }}>Rôles</th>
                  <th style={{ width: '12%' }}>Inscription</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const formattedDate = u.created_at
                    ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenUser(u)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <UserAvatar
                            avatarUrl={u.avatar_url}
                            fullName={u.full_name}
                            email={u.email}
                            size={36}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--color-text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.full_name || 'Sans nom'}
                            </div>
                            <div
                              style={{
                                fontSize: '0.775rem',
                                color: 'var(--color-text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-main)' }}>
                          {u.phone || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {u.city || 'Ville non renseignée'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {u.roles.map((r) => (
                            <RoleBadge key={r} role={r} size="sm" />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {formattedDate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUser(u);
                          }}
                          style={{
                            color: 'var(--color-accent)',
                            borderColor: 'rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div
            id="admin-mobile-cards"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {filteredUsers.map((u) => {
              const formattedDate = u.created_at
                ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={u.id}
                  onClick={() => handleOpenUser(u)}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserAvatar
                      avatarUrl={u.avatar_url}
                      fullName={u.full_name}
                      email={u.email}
                      size={40}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.925rem',
                          color: 'var(--color-text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {u.full_name || 'Sans nom'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {u.roles.map((r) => (
                      <RoleBadge key={r} role={r} size="sm" />
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '0.5rem',
                      fontSize: '0.775rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span>Inscrit : {formattedDate}</span>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUser(u);
                      }}
                      style={{
                        color: 'var(--color-accent)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      Gérer rôles &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail & Role Management Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};
