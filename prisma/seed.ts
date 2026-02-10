import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Default Company',
    },
  });

  console.log('Created customer:', customer);

  // Create an admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      customerId: customer.id,
    },
  });

  console.log('Created admin user:', adminUser);

  // Create a regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
      customerId: customer.id,
    },
  });

  console.log('Created regular user:', regularUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });