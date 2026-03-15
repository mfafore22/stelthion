import 'dotenv/config'
import pg from 'pg'
import bcrypt from 'bcrypt'

const { Pool } = pg

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL })
  
  const hashedPassword = await bcrypt.hash('admin123', 10)

  try {
    // Create Customers
    await pool.query(`
      INSERT INTO "Customer" (id, name, "createdAt", "updatedAt") VALUES
      ('acme-inc', 'Acme Inc.', NOW(), NOW()),
      ('beta-corp', 'Beta Corp', NOW(), NOW()),
      ('gamma-ltd', 'Gamma Ltd', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `)

    // Create Users
    await pool.query(`
      INSERT INTO "User" (id, email, password, name, role, "customerId", "twoFactorEnabled", "createdAt", "updatedAt") VALUES
      ('user-acme', 'admin@acme.com', $1, 'John Admin', 'ADMIN', 'acme-inc', false, NOW(), NOW()),
      ('user-beta', 'admin@beta.com', $1, 'Jane Admin', 'ADMIN', 'beta-corp', false, NOW(), NOW()),
      ('user-gamma', 'admin@gamma.com', $1, 'Bob Admin', 'ADMIN', 'gamma-ltd', false, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword])

    // Create Stats
    await pool.query(`
      INSERT INTO "Stats" (id, "customerId", "totalUnits", "topCategory", "foodBeverage", "fashionRetail", "currentVisitors", "dwellTime", "conversionRate", "createdAt", "updatedAt") VALUES
      ('stats-acme', 'acme-inc', 189, 'Restaurant', 29.6, 18.0, 1500, 45, 23, NOW(), NOW()),
      ('stats-beta', 'beta-corp', 75, 'Fashion', 15.5, 42.0, 820, 32, 18, NOW(), NOW()),
      ('stats-gamma', 'gamma-ltd', 320, 'Electronics', 8.2, 12.5, 2100, 55, 31, NOW(), NOW())
      ON CONFLICT ("customerId") DO NOTHING
    `)

    console.log('✅ Seeded: Acme Inc, Beta Corp, Gamma Ltd with stats')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

main()