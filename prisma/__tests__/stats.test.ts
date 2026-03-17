describe('Stats', () => {
  const createDefaultStats = (customerId: string) => {
    return {
      customerId,
      totalUnits: 0,
      topCategory: 'N/A',
      foodBeverage: 0,
      fashionRetail: 0,
      currentVisitors: 0,
      dwellTime: 0,
      conversionRate: 0,
    }
  }

  const formatVisitors = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  describe('Default stats', () => {
    it('should create stats with zeros', () => {
      const stats = createDefaultStats('test-company')
      expect(stats.totalUnits).toBe(0)
      expect(stats.topCategory).toBe('N/A')
      expect(stats.currentVisitors).toBe(0)
    })

    it('should link to correct company', () => {
      const stats = createDefaultStats('acme-inc')
      expect(stats.customerId).toBe('acme-inc')
    })
  })

  describe('Format visitors', () => {
    it('should format 1500 as 1.5k', () => {
      expect(formatVisitors(1500)).toBe('1.5k')
    })

    it('should format 500 as 500', () => {
      expect(formatVisitors(500)).toBe('500')
    })

    it('should format 2100 as 2.1k', () => {
      expect(formatVisitors(2100)).toBe('2.1k')
    })
  })
})