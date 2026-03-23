'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SwirlLoader } from '@/components/ui/SwirlLoader';

export type UserRole = 'ADMIN' | 'OPS' | 'VIEWER' | 'AGENT_SERVICE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  refreshToken: () => Promise<void>;
}

// Permission mappings based on backend middleware
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['execute', 'batch', 'preset:read', 'preset:write', 'admin'],
  OPS: ['execute', 'batch', 'preset:read', 'preset:write'],
  VIEWER: ['preset:read'],
  AGENT_SERVICE: ['execute', 'preset:read', 'agent']
};

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Validate token with backend
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            setUser(result.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth_token', result.token);
        setUser(result.user);
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      setError(null);
    }
  }, []);

  // Check permission
  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }, [user]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('auth_token', result.token);
          setUser(result.user);
        }
      } else {
        await logout();
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      await logout();
    }
  }, [logout]);

  return {
    // State
    user,
    isAuthenticated: !!user,
    isLoading,
    error,

    // Actions
    login,
    logout,
    checkPermission,
    refreshToken
  };
}

export function usePermissions() {
  const { user, checkPermission } = useAuth();

  return {
    canExecute: checkPermission('execute'),
    canBatch: checkPermission('batch'),
    canReadPresets: checkPermission('preset:read'),
    canWritePresets: checkPermission('preset:write'),
    isAdmin: checkPermission('admin'),
    isAgent: checkPermission('agent'),
    user
  };
}

export function withPermission(permission: string) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionProtectedComponent(props: P) {
      const { checkPermission, isLoading, user } = useAuth();

      if (isLoading) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-2 flex justify-center"><SwirlLoader size="lg" /></div>
              <p className="text-sm text-muted-foreground">Checking permissions...</p>
            </div>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Please log in to access this feature.</p>
            </div>
          </div>
        );
      }

      if (!checkPermission(permission)) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You don&apos;t have permission to access this feature.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Required permission: {permission}
              </p>
            </div>
          </div>
        );
      }

      return <Component {...props} />;
    };
  };
}

export function useDemoAuth() {
  const login = useCallback(async (role: UserRole = 'OPS') => {
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@stelthion.com',
      name: 'Demo User',
      role
    };

    // Create a simple demo token
    const demoToken = btoa(JSON.stringify(demoUser));
    localStorage.setItem('auth_token', demoToken);

    return demoUser;
  }, []);

  return { login };
}