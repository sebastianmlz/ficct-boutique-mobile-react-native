import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApolloError, gql, useMutation } from '@apollo/client';

import { inMemoryToken, tokenStorage, type StoredUser } from './token-storage';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      expiresAt
      user {
        id
        email
        fullName
        role
      }
    }
  }
`;

type LoginResponse = {
  login: {
    accessToken: string;
    expiresAt: string;
    user: StoredUser;
  };
};

interface AuthContextValue {
  user: StoredUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [runLogin] = useMutation<LoginResponse>(LOGIN_MUTATION);

  useEffect(() => {
    void (async () => {
      const stored = await tokenStorage.load();
      if (stored) {
        inMemoryToken.set(stored.token);
        setUser(stored.user);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);
    try {
      const result = await runLogin({ variables: { email, password } });
      const payload = result.data?.login;
      if (!payload) {
        setLoginError(result.errors?.[0]?.message ?? 'No se pudo iniciar sesión');
        return false;
      }
      inMemoryToken.set(payload.accessToken);
      await tokenStorage.save(payload.accessToken, payload.expiresAt, payload.user);
      setUser(payload.user);
      return true;
    } catch (err) {
      const message = err instanceof ApolloError ? err.message : (err as Error).message;
      setLoginError(message || 'Error inesperado');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    inMemoryToken.set(null);
    await tokenStorage.clear();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      loginError,
      login,
      logout,
    }),
    [user, loading, loginError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
