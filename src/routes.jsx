import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AdminRouteLayout from '@/components/layout/AdminRouteLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { RoleGuard } from '@/components/common/ProtectedRoute';

// ---------------------------------------------------------------------------
// Lazy-loaded page components (code-split per route)
// ---------------------------------------------------------------------------
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AirlinesPage = lazy(() => import('@/pages/admin/AirlinesPage'));
const AirportsPage = lazy(() => import('@/pages/admin/AirportsPage'));
const AircraftTypesPage = lazy(() => import('@/pages/admin/AircraftTypesPage'));
const AircraftsPage      = lazy(() => import('@/pages/admin/AircraftsPage'));
const BeltsPage = lazy(() => import('@/pages/admin/BeltsPage'));
const CheckinDesksPage = lazy(() => import('@/pages/admin/CheckinDesksPage'));
const CountriesPage = lazy(() => import('@/pages/admin/CountriesPage'));
const DelayCodesPage = lazy(() => import('@/pages/admin/DelayCodesPage'));
const GatesPage = lazy(() => import('@/pages/admin/GatesPage'));
const GroundHandlersPage = lazy(() => import('@/pages/admin/GroundHandlersPage'));
const RunwaysPage = lazy(() => import('@/pages/admin/RunwaysPage'));
const StandsPage = lazy(() => import('@/pages/admin/StandsPage'));
const TerminalsPage = lazy(() => import('@/pages/admin/TerminalsPage'));
const TenantsPage = lazy(() => import('@/pages/admin/TenantsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const OperationalStatusPage = lazy(() => import('@/pages/admin/OperationalStatusPage'));

// ---------------------------------------------------------------------------
// Suspense fallback shown while a lazy chunk is loading
// ---------------------------------------------------------------------------
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="spinner" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Application routes
// ---------------------------------------------------------------------------
export default function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener('unauthorized', handler);
    return () => window.removeEventListener('unauthorized', handler);
  }, [navigate]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<ProtectedRoute><AdminRouteLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="airports" element={<AirportsPage />} />
          <Route path="area" element={<AirportsPage />} />
          <Route path="airlines" element={<AirlinesPage />} />
          
          <Route path="aircraft-types" element={<AircraftTypesPage />} />
          <Route path="aircrafts" element={<AircraftsPage />} />
          <Route path="belts" element={<BeltsPage />} />
          <Route path="checkin-desks" element={<CheckinDesksPage />} />
          <Route path="countries" element={<CountriesPage />} />
          <Route path="delay-codes" element={<DelayCodesPage />} />
          <Route path="gates" element={<GatesPage />} />
          <Route path="ground-handlers" element={<GroundHandlersPage />} />
          <Route path="runways" element={<RunwaysPage />} />
          <Route path="stands" element={<StandsPage />} />
          <Route path="terminals" element={<TerminalsPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="users" element={<RoleGuard allowed={['ADMIN']}><UsersPage /></RoleGuard>} />
          <Route path="operational-status" element={<OperationalStatusPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
