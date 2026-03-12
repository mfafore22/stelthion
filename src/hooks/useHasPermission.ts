/**
 * Re-export permission hooks for convenience
 * Allows importing from @/hooks instead of @/contexts
 */

export {
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  usePermissions,
  useUserSession,
} from '@/contexts/PermissionsContext';
