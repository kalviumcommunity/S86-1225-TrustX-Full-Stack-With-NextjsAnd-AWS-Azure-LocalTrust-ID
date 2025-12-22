import Link from "next/link";

// Mocked users list for demo
const users = [
  { id: "1", name: "Dinesh" },
  { id: "2", name: "Hasini" },
  { id: "3", name: "Bhanu" },
];

export default function UsersPage() {
  return (
    <main className="mt-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-gray-600 mt-2">Select a user to view their profile.</p>

      <ul className="mt-4 space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <Link href={`/users/${u.id}`} className="text-blue-600">
              {u.name} (ID: {u.id})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
