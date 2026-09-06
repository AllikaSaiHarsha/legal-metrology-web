const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@metrology.gov' },
    update: {
      password: hashedPassword,
      name: 'Rajesh Kumar (Admin)',
      role: 'admin'
    },
    create: {
      email: 'admin@metrology.gov',
      name: 'Rajesh Kumar (Admin)',
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('Seeded admin user:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
