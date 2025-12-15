import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: "Alice", email: "alice@example.com", role: "ADMIN" },
      { name: "Bob", email: "bob@example.com", role: "USER" }
    ],
    skipDuplicates: true
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
