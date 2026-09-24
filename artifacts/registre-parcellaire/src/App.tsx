import { lazy, ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { getGetCurrentUserQueryKey } from '@workspace/api-client-react';

import Home from '@/pages/home';
import SignInPage from '@/pages/sign-in';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { DataSpinner } from '@/components/data-spinner';

const Dashboard = lazy(() => import('@/pages/dashboard'));
const FichesList = lazy(() => import('@/pages/fiches/list'));
const FicheNew = lazy(() => import('@/pages/fiches/new'));
const FicheDetail = lazy(() => import('@/pages/fiches/detail'));
const FicheExample = lazy(() => import('@/pages/fiches/example'));
const Imprimerie = lazy(() => import('@/pages/imprimerie'));
const Parametres = lazy(() => import('@/pages/parametres'));
const Utilisateurs = lazy(() => import('@/pages/utilisateurs'));
const PlaqueModele = lazy(() => import('@/pages/plaques/modele'));
const FichePlaque = lazy(() => import('@/pages/plaques/fiche-plaque'));

const handleUnauthorized = (error: unknown) => {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    error.status === 401
  ) {
    const authQueryKey = getGetCurrentUserQueryKey();

    queryClient.cancelQueries({
      predicate: (query) => query.queryKey[0] !== authQueryKey[0]
    });

    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== authQueryKey[0]
    });

    queryClient.setQueryData(authQueryKey, null);
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleUnauthorized,
  }),
  mutationCache: new MutationCache({
    onError: handleUnauthorized,
  }),
});
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType<any>, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <DataSpinner />
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<DataSpinner />}>
        <Component />
      </Suspense>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />

        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?">
          <Redirect to="/sign-in" />
        </Route>

        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>

        <Route path="/fiches">
          {() => <ProtectedRoute component={FichesList} />}
        </Route>

        <Route path="/fiches/nouvelle">
          {() => <ProtectedRoute component={FicheNew} />}
        </Route>

        <Route path="/fiches/exemple">
          {() => <Suspense fallback={<DataSpinner />}><FicheExample /></Suspense>}
        </Route>

        <Route path="/fiches/:id">
          {() => <ProtectedRoute component={FicheDetail} />}
        </Route>

        <Route path="/imprimerie">
          {() => <ProtectedRoute component={Imprimerie} />}
        </Route>

        <Route path="/parametres">
          {() => <ProtectedRoute component={Parametres} allowedRoles={['admin_principal', 'validateur']} />}
        </Route>

        <Route path="/utilisateurs">
          {() => <ProtectedRoute component={Utilisateurs} allowedRoles={['admin_principal']} />}
        </Route>

        <Route path="/plaques/modele">
          {() => (
            <DashboardLayout>
              <Suspense fallback={<DataSpinner />}><PlaqueModele /></Suspense>
            </DashboardLayout>
          )}
        </Route>

        <Route path="/fiches/:id/plaque">
          {() => <ProtectedRoute component={FichePlaque} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
