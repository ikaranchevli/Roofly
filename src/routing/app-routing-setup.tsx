import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';

import { AuthGuard, GuestGuard } from './guards';

// ... (keep the rest of imports and lazy components as is, I will replace the whole return block below)

const DashboardPage = lazy(() =>
  import('@/pages/dashboard/page').then((m) => ({ default: m.DashboardPage })),
);
const TenantsPage = lazy(() =>
  import('@/pages/tenants/page').then((m) => ({ default: m.TenantsPage })),
);
const TenantDetailPage = lazy(() =>
  import('@/pages/tenants/detail/page').then((m) => ({ default: m.TenantDetailPage })),
);
const BillsPage = lazy(() =>
  import('@/pages/bills/page').then((m) => ({ default: m.BillsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/page').then((m) => ({ default: m.SettingsPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/auth/login/page').then((m) => ({ default: m.LoginPage })),
);
const SignUpPage = lazy(() =>
  import('@/pages/auth/signup/page').then((m) => ({ default: m.SignUpPage })),
);
const JoinPage = lazy(() =>
  import('@/pages/auth/join/page').then((m) => ({ default: m.JoinPage })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AppRoutingSetup() {
  return (
    <Routes>
      {/* Protected Routes - Only accessible when logged in */}
      <Route element={<AuthGuard />}>
        <Route element={<Layout1 />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/tenants"
            element={
              <Suspense fallback={<PageLoader />}>
                <TenantsPage />
              </Suspense>
            }
          />
          <Route
            path="/tenants/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <TenantDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/bills"
            element={
              <Suspense fallback={<PageLoader />}>
                <BillsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* Guest Routes - Only accessible when logged out */}
      <Route element={<GuestGuard />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<PageLoader />}>
              <SignUpPage />
            </Suspense>
          }
        />
        <Route
          path="/join"
          element={
            <Suspense fallback={<PageLoader />}>
              <JoinPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

