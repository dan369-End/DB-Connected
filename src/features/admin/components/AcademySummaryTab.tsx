import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { AcademyIcon } from '@/components/icons';
import type { AdminGlobalStats } from '@/types';

interface AcademySummaryTabProps {
  stats: AdminGlobalStats;
}

export const AcademySummaryTab: React.FC<AcademySummaryTabProps> = ({ stats }) => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="admin-quick-actions-bar">
        <div className="quick-actions-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ color: 'var(--color-accent)', display: 'inline-flex' }}>
              <AcademyIcon size={22} />
            </span>
            <h2 className="overview-headline">Module Académie</h2>
          </div>
          <p className="overview-subline">
            Supervision globale des formations, des contenus pédagogiques et des apprenants inscrits.
          </p>
        </div>
        <div className="quick-actions-buttons">
          <button
            type="button"
            className="btn-admin-cta primary"
            onClick={() => navigate('academy_admin')}
          >
            Ouvrir Administration Académie &rarr;
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Formations</span>
          <span className="stat-value">{stats.academy.totalCourses}</span>
          <span className="stat-detail">Catalogue complet créé</span>
        </div>

        <div className="admin-stat-card stat-published">
          <span className="stat-label">Formations Publiées</span>
          <span className="stat-value text-success">{stats.academy.publishedCourses}</span>
          <span className="stat-detail">Visibles des apprenants</span>
        </div>

        <div className="admin-stat-card stat-draft">
          <span className="stat-label">En Brouillon</span>
          <span className="stat-value text-warning">{stats.academy.draftCourses}</span>
          <span className="stat-detail">En cours de rédaction</span>
        </div>

        <div className="admin-stat-card">
          <span className="stat-label">Inscriptions Apprenants</span>
          <span className="stat-value text-accent">{stats.academy.totalEnrollments}</span>
          <span className="stat-detail">Cumul des inscriptions</span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Fonctionnalités du Back-office Académie
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          L'administration dédiée de l'Académie permet aux gestionnaires pédagogiques de créer et éditer des cours complets, structurer les modules d'apprentissage, injecter des vidéos YouTube ou leçons texte, et organiser les catégories.
        </p>
        <div>
          <button
            type="button"
            className="btn-admin-cta secondary"
            onClick={() => navigate('academy_admin')}
          >
            Accéder à l'espace complet Académie
          </button>
        </div>
      </div>
    </div>
  );
};
