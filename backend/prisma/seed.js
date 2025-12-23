const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@insurance.com' },
    update: {},
    create: {
      email: 'admin@insurance.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'staff@insurance.com' },
    update: {},
    create: {
      email: 'staff@insurance.com',
      name: 'Staff User',
      password: staffPassword,
      role: 'STAFF'
    }
  });

  const products = [
    {
      name: 'Health Shield',
      type: 'HEALTH',
      description: 'Comprehensive health insurance',
      basePremium: 300,
      exclusions: ['pre-existing conditions']
    },
    {
      name: 'Life Secure',
      type: 'LIFE',
      description: 'Life cover with add-ons',
      basePremium: 250,
      exclusions: ['self-inflicted injuries']
    },
    {
      name: 'Motor Protect',
      type: 'MOTOR',
      description: 'Vehicle insurance for personal cars',
      basePremium: 180,
      exclusions: ['commercial use', 'racing']
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
