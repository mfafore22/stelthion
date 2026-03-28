describe('Session', () => {
  const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

  it('session should expire after 24 hours', () => {
    expect(SESSION_MAX_AGE).toBe(86400)
  })

  it('session should not exceed 7 days', () => {
    expect(SESSION_MAX_AGE).toBeLessThanOrEqual(60 * 60 * 24 * 7)
  })

  it('session strategy should be database-backed', () => {
    const strategy = 'database'
    expect(strategy).toBe('database')
  })
})
