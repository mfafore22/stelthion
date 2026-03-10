describe('Company Separation', () => {
  const companies = [
    { id: 'acme-inc', name: 'Acme Inc.' },
    { id: 'beta-corp', name: 'Beta Corp' },
  ]

  const users = [
    { id: 'user1', email: 'admin@acme.com', customerId: 'acme-inc' },
    { id: 'user2', email: 'admin@beta.com', customerId: 'beta-corp' },
  ]

  const stats = [
    { customerId: 'acme-inc', totalUnits: 189 },
    { customerId: 'beta-corp', totalUnits: 75 },
  ]

  const getStatsForUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return null
    return stats.find(s => s.customerId === user.customerId)
  }

  it('Acme user should only see Acme stats', () => {
    const acmeStats = getStatsForUser('user1')
    expect(acmeStats?.totalUnits).toBe(189)
    expect(acmeStats?.customerId).toBe('acme-inc')
  })

  it('Beta user should only see Beta stats', () => {
    const betaStats = getStatsForUser('user2')
    expect(betaStats?.totalUnits).toBe(75)
    expect(betaStats?.customerId).toBe('beta-corp')
  })

  it('Users should not see other company data', () => {
    const acmeStats = getStatsForUser('user1')
    const betaStats = getStatsForUser('user2')
    
    expect(acmeStats?.customerId).not.toBe(betaStats?.customerId)
  })
})