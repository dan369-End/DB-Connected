import { NavItemConfig } from '@/types';

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Accueil',
    path: '/',
    icon: 'home',
    description: 'Tableau de bord principal',
  },
  {
    id: 'academy',
    label: 'Académie',
    path: '/academy',
    icon: 'academy',
    description: 'Formations numériques et compétences',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    path: '/marketplace',
    icon: 'marketplace',
    description: 'Offres, boutiques et solutions numériques',
  },
  {
    id: 'services',
    label: 'Services',
    path: '/services',
    icon: 'services',
    description: 'Prestations et solutions professionnelles',
  },
  {
    id: 'opportunities',
    label: 'Opportunités',
    path: '/opportunities',
    icon: 'opportunities',
    description: 'Annonces, appels à projets et offres',
  },
  {
    id: 'requests',
    label: 'Mes demandes',
    path: '/requests',
    icon: 'requests',
    description: 'Suivi de mes messages et demandes de devis',
  },
  {
    id: 'profile',
    label: 'Mon profil',
    path: '/profile',
    icon: 'profile',
    description: 'Informations personnelles et compte',
  },
];
