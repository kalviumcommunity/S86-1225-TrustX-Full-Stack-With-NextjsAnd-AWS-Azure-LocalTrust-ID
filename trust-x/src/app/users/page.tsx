"use client";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AddUser from "./AddUser";

export default function UsersPage() {
  const { data, error, isLoading } = useSWR('/api/users', fetcher);

  if (error) return <p className="text-red-600">Failed to load users.</p>;
  if (isLoading) return <p>Loading...</p>;

  return (
    <main className="mt-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-gray-600 mt-2">Select a user to view their profile.</p>

      <ul className="mt-4 space-y-2">
        {Array.isArray(data) && data.map((u: any) => (
          <li key={u.id}>
            <Link href={`/users/${u.id}`} className="text-blue-600">
              {u.name} (ID: {u.id})
            </Link>
          </li>
        ))}
      </ul>

      <AddUser />
    </main>
  );
}
