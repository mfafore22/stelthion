// app/api/seed/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function POST() {
  const customerWithUser = await prisma.customer.create({
    data: {
      name: 'Acme Inc.',
      users: {
        create: {
          email: 'admin@acme.com',
          password: 'some-hash-or-temp',
          name: 'Admin User',
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  })

  return NextResponse.json(customerWithUser)
}