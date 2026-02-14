import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Check if customer already exists
  const existingCustomer = await prisma.customer.findFirst({
    where: { name: 'Acme Inc.' }
  })

  if (existingCustomer) {
    return NextResponse.json({ message: 'Seed data already exists' })
  }

  // Create customer with admin user
  const customerWithUser = await prisma.customer.create({
    data: {
      name: 'Acme Inc.',
      users: {
        create: {
          email: 'admin@acme.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  })


  return NextResponse.json({ 
    message: 'Seed successful',
    customer: customerWithUser 
  })
}