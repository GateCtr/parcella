import { lazy, ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { ClerkProvider, Show } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { frFR } from '@clerk/localizations';

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
const PlaqueModele = lazy(() => import('@/pages/plaques/modele'));
const FichePlaque = lazy(() => import('@/pages/plaques/fiche-plaque'));

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <>
      <Show when="signed-in">
        <DashboardLayout>
          <Suspense fallback={<DataSpinner />}>
            <Component />
          </Suspense>
        </DashboardLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
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

        <Route path="/plaques/modele">
          {() => <Suspense fallback={<DataSpinner />}><PlaqueModele /></Suspense>}
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
      <ClerkProvider
        publishableKey={clerkPubKey}
        localization={frFR}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        signInFallbackRedirectUrl="/dashboard"
        proxyUrl={clerkProxyUrl}
      >
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
