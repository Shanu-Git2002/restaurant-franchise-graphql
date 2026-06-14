import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { apolloClient } from '@/lib/apollo';
import { queryClient } from '@/lib/queryClient';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { RegisterPage } from '@/features/auth/components/RegisterPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { OutletsPage } from '@/features/outlets/components/OutletsPage';
import { EmployeesPage } from '@/features/employees/components/EmployeesPage';
import { ReviewsPage } from '@/features/reviews/components/ReviewsPage';
import { AnalyticsPage } from '@/features/analytics/components/AnalyticsPage';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/outlets"
                    element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />}
                  >
                    <Route index element={<OutletsPage />} />
                  </Route>
                  <Route
                    path="/employees"
                    element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />}
                  >
                    <Route index element={<EmployeesPage />} />
                  </Route>
                  <Route path="/reviews" element={<ErrorBoundary><ReviewsPage /></ErrorBoundary>} />
                  <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
                  <Route path="/settings" element={<div className="p-8 text-center text-muted-foreground">Settings coming soon</div>} />
                </Route>
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
