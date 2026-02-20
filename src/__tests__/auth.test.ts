import bcrypt from 'bcrypt'

describe('Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'admin123'
      const hashedPassword = await bcrypt.hash(password, 10)
      
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should verify correct password', async () => {
      const password = 'admin123'
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const isValid = await bcrypt.compare(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject wrong password', async () => {
      const password = 'admin123'
      const wrongPassword = 'wrong123'
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })
})