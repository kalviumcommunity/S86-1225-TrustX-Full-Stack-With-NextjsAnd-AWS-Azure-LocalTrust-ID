interface Props {
  params: { id: string };
}

export default async function UserProfile({ params }: Props) {
  const { id } = params;

  // Mock fetch user data
  const user = { id, name: "User " + id };

  return (
    <main className="flex flex-col items-center mt-10">
      <nav className="w-full mb-4">
        <div className="text-sm text-gray-600">Home / Users / {user.name}</div>
      </nav>

      <h2 className="text-xl font-bold">User Profile</h2>
      <div className="mt-4 text-gray-700">
        <p>ID: {user.id}</p>
        <p>Name: {user.name}</p>
      </div>
    </main>
  );
}
