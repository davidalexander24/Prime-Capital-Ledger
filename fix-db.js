const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.account.deleteMany({
    where: { provider: "google" }
  });
  console.log("Deleted accounts:", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
