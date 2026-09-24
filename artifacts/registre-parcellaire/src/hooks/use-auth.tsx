import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AuthUser,
  useGetCurrentUser,
  useLogin,
  useLogout,
  getGetCurrentUserQueryKey,
} from '@workspace/api-client-react';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: typeof useLogin.prototype.mutateAsync;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false, // Don't retry 401s
    }
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const clearUserScopedQueries = () => {
    const authQueryKey = getGetCurrentUserQueryKey();
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== authQueryKey[0]
    });
  };

  // If a 401/error occurs on the main GET /auth/me or a mutation throws a 401,
  // we want to proactively clear cached user data so it's not visible anymore.
  // We use a ref to only clear cache when transitioning to an error state.
  const wasError = useRef(isError);
  useEffect(() => {
    if (isError && !wasError.current) {
      clearUserScopedQueries();
    }
    wasError.current = isError;
  }, [isError, queryClient]);

  const login = async (...args: Parameters<typeof loginMutation.mutateAsync>) => {
    const result = await loginMutation.mutateAsync(...args);
    clearUserScopedQueries();
    queryClient.setQueryData(getGetCurrentUserQueryKey(), result);
    return result;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    clearUserScopedQueries();
    queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: isError ? null : (user ?? null),
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
