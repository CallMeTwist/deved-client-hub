// src/hooks/usePermission.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Returns true if the current user has the given permission.
 *
 * Usage:
 *   const canCreate = usePermission('create_clients');
 *   {canCreate && <button onClick={openModal}>New Client</button>}
 */
export function usePermission(permission: string): boolean {
  const ctx = useContext(AuthContext);
  return ctx?.user?.permissions?.includes(permission) ?? false;
}

/**
 * Returns true if the user has ALL of the given permissions.
 */
export function usePermissions(permissions: string[]): boolean {
  const ctx = useContext(AuthContext);
  if (!ctx?.user?.permissions) return false;
  return permissions.every((p) => ctx.user!.permissions.includes(p));
}


/**
 * Returns true if the user has ANY of the given permissions.
 */
export function useAnyPermission(permissions: string[]): boolean {
  const ctx = useContext(AuthContext);
  if (!ctx?.user?.permissions) return false;
  return permissions.some((p) => ctx.user!.permissions.includes(p));
}