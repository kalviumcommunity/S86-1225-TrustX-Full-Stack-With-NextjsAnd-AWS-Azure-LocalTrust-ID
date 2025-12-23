"use client";
import { useState } from "react";
import useSWR from "swr";
import { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

export default function AddUser() {
  const { data } = useSWR('/api/users', fetcher);
  const [name, setName] = useState('');

  const addUser = async () => {
    if (!name) return;

    // generate a temp email and password for the demo
    const tempEmail = `temp+${Date.now()}@example.com`;
    const tempPassword = Math.random().toString(36).slice(2, 10);

    const optimistic = [...(Array.isArray(data) ? data : []), { id: Date.now(), name, email: tempEmail }];

    // Optimistic update: update cache immediately, do not revalidate yet
    mutate('/api/users', optimistic, false);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: tempEmail, password: tempPassword }),
      });
    } catch (err) {
      // On error, revalidate to restore correct state
      await mutate('/api/users');
      setName('');
      return;
    }

    // Revalidate after server confirms
    await mutate('/api/users');
    setName('');
  };

  return (
    <div className="mt-6">
      <input
        className="border px-2 py-1 mr-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter user name"
      />
      <button
        onClick={addUser}
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >
        Add User
      </button>
    </div>
  );
}
