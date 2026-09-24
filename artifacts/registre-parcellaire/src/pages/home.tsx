import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DataSpinner } from '@/components/data-spinner';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <DataSpinner />;

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Redirect to="/sign-in" />;
}