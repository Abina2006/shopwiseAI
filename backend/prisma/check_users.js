import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  console.log(`=== REGISTERED USERS IN POSTGRESQL (${users.length} Users) ===`);
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

checkUsers();
