
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in after component mounts (client-side only)
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Trust-X
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your Next.js app with secure authentication
          </p>

          {!isLoggedIn ? (
            <div className="space-x-4">
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign Up
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-green-600">You are logged in!</p>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Authentication</h3>
              <p className="text-gray-600">bcrypt password hashing and JWT tokens for secure user authentication.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Routes</h3>
              <p className="text-gray-600">RESTful API endpoints for signup, login, and protected resources.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Integration</h3>
              <p className="text-gray-600">Prisma ORM with SQLite for reliable data persistence.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
