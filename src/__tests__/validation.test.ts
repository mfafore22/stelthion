describe('Validation', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should accept valid email', () => {
      expect(isValidEmail('admin@acme.com')).toBe(true)
      expect(isValidEmail('user@company.co.uk')).toBe(true)
    })

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('no@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
    })
  })

  describe('Password Validation', () => {
    const isValidPassword = (password: string) => {
      return password.length >= 6
    }

    it('should accept password with 6+ characters', () => {
      expect(isValidPassword('admin123')).toBe(true)
      expect(isValidPassword('123456')).toBe(true)
    })

    it('should reject password with less than 6 characters', () => {
      expect(isValidPassword('12345')).toBe(false)
      expect(isValidPassword('abc')).toBe(false)
    })
  })
})