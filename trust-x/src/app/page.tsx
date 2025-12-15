
import { prisma } from "../lib/prisma";


export default async function Home() {
  const users = await prisma.user.findMany();
  console.log("Users from database:", users);

  return (
    <main>
      <h1>Welcome to Trust-X</h1>
      <p>Your Next.js app is running successfully in Docker.</p>
    </main>
  );
}
