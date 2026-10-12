import React from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { DashboardHomePage } from './DashboardHomePage';
import { ProfilePage } from './ProfilePage';
import { ModulePlaceholderPage } from './ModulePlaceholderPage';
import { AcademyPage, AcademyAdminPage, CourseDetail, CoursePlayer } from '@/features/academy';
import {
  MarketplacePage,
  MarketplaceAdminPage,
  ProductDetail,
  CartPage,
  CheckoutPage,
  OrdersPage,
  OrderDetail,
} from '@/features/marketplace';
import {
  ServicesPage,
  ServicesAdminPage,
  ServiceDetail,
  MyServiceRequests,
} from '@/features/services';
import {
  OpportunitiesPage,
  OpportunitiesAdminPage,
  OpportunityDetail,
  MyApplications,
} from '@/features/opportunities';
import {
  MyRequestsPage,
  AdminRequestsPage,
} from '@/features/requests';
import { SuperAdminPage } from '@/features/admin';

export const DashboardContentRouter: React.FC = () => {
  const { currentRoute, routeParams } = useNavigation();

  switch (currentRoute) {
    case 'home':
      return <DashboardHomePage />;
    case 'academy':
      return <AcademyPage />;
    case 'academy_course':
      return <CourseDetail courseId={routeParams.courseId || ''} />;
    case 'academy_player':
      return <CoursePlayer courseId={routeParams.courseId || ''} />;
    case 'academy_admin':
      return <AcademyAdminPage />;
    case 'marketplace':
      return <MarketplacePage />;
    case 'marketplace_product':
      return <ProductDetail productId={routeParams.productId || ''} />;
    case 'marketplace_cart':
      return <CartPage />;
    case 'marketplace_checkout':
      return <CheckoutPage />;
    case 'marketplace_orders':
      return <OrdersPage />;
    case 'marketplace_order_detail':
      return <OrderDetail orderId={routeParams.orderId || ''} />;
    case 'marketplace_admin':
      return <MarketplaceAdminPage />;
    case 'services':
      return <ServicesPage />;
    case 'services_detail':
      return <ServiceDetail serviceId={routeParams.serviceId || ''} />;
    case 'services_requests':
      return <MyServiceRequests />;
    case 'services_admin':
      return <ServicesAdminPage />;
    case 'opportunities':
      return <OpportunitiesPage />;
    case 'opportunities_detail':
      return <OpportunityDetail opportunityId={routeParams.opportunityId || ''} />;
    case 'opportunities_applications':
      return <MyApplications />;
    case 'opportunities_admin':
      return <OpportunitiesAdminPage />;
    case 'requests':
    case 'request_detail':
      return <MyRequestsPage />;
    case 'requests_admin':
      return <AdminRequestsPage />;
    case 'admin':
      return <SuperAdminPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <DashboardHomePage />;
  }
};
