import { isAdmin, isManager, isAdminOrManager, canAccess } from '@/app/lib/role-check'

describe('Role Check', () => {
  describe('isAdmin', () => {
    it('returns true for ADMIN', () => {
      expect(isAdmin('ADMIN')).toBe(true)
    })

    it('returns false for MANAGER', () => {
      expect(isAdmin('MANAGER')).toBe(false)
    })

    it('returns false for USER', () => {
      expect(isAdmin('USER')).toBe(false)
    })
  })

  describe('isManager', () => {
    it('returns true for MANAGER', () => {
      expect(isManager('MANAGER')).toBe(true)
    })

    it('returns false for ADMIN', () => {
      expect(isManager('ADMIN')).toBe(false)
    })

    it('returns false for USER', () => {
      expect(isManager('USER')).toBe(false)
    })
  })

  describe('isAdminOrManager', () => {
    it('returns true for ADMIN', () => {
      expect(isAdminOrManager('ADMIN')).toBe(true)
    })

    it('returns true for MANAGER', () => {
      expect(isAdminOrManager('MANAGER')).toBe(true)
    })

    it('returns false for USER', () => {
      expect(isAdminOrManager('USER')).toBe(false)
    })
  })

  describe('canAccess', () => {
    it('returns true if role is in allowed list', () => {
      expect(canAccess('ADMIN', ['ADMIN', 'MANAGER'])).toBe(true)
    })

    it('returns false if role is not in allowed list', () => {
      expect(canAccess('USER', ['ADMIN', 'MANAGER'])).toBe(false)
    })
  })
})