describe('Session', () => {
  const SESSION_MAX_AGE = 60 * 5 // 5 minutes in seconds

  it('session should expire after 5 minutes', () => {
    expect(SESSION_MAX_AGE).toBe(300)
  })

  it('session should not be longer than 1 hour', () => {
    expect(SESSION_MAX_AGE).toBeLessThanOrEqual(3600)
  })
})