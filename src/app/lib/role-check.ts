export type Role = 'ADMIN' | 'MANAGER' | 'USER'

export function canAccess(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role)
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN'
}

export function isManager(role: string): boolean {
  return role === 'MANAGER'
}

export function isAdminOrManager(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}