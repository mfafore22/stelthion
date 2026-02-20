describe('Environment Variables', () => {
  it('should have DATABASE_URL defined', () => {
    expect(process.env.DATABASE_URL).toBeDefined()
  })

  it('should have AUTH_SECRET defined', () => {
    expect(process.env.AUTH_SECRET).toBeDefined()
  })
})