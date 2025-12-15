const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "Dinesh",
      email: "dinesh@example.com",
      projects: {
        create: {
          title: "Trust-X Platform",
          tasks: {
            create: [
              { title: "Design PostgreSQL schema" },
              { title: "Docker + Prisma integration" }
            ]
          }
        }
      }
    }
  });

  console.log("Seed data inserted");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
