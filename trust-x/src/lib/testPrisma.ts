import { prisma } from "./prisma";

export async function getUsers() {
  const users = await prisma.user.findMany();
  console.log("Users from DB:", users);
}
