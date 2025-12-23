
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';

export default function Home() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUI();

  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Context & Hooks Demo</h1>
          <p className="text-gray-500">Demonstrates `AuthContext` and `UIContext` via `useAuth` and `useUI`.</p>
        </div>

        <section className="bg-white/5 p-6 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth State</h2>
          {isAuthenticated ? (
            <div className="space-y-3">
              <p>Logged in as: <strong>{user}</strong></p>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
            </div>
          ) : (
            <div className="space-y-3">
              <p>You are not logged in.</p>
              <button onClick={() => login('DemoUser')} className="bg-green-600 text-white px-4 py-2 rounded">Login as DemoUser</button>
            </div>
          )}
        </section>

        <section className="bg-white/5 p-6 rounded-md">
          <h2 className="text-xl font-semibold mb-4">UI Controls</h2>
          <p className="mb-3">Current Theme: <strong>{theme}</strong></p>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={toggleTheme} className="bg-blue-600 text-white px-3 py-2 rounded">Toggle Theme</button>
            <button onClick={toggleSidebar} className="bg-yellow-400 text-black px-3 py-2 rounded">{sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}</button>
          </div>
          <p className="text-sm text-gray-400">Console logs show state transitions (login/logout, theme toggle, sidebar).</p>
        </section>
      </div>
    </main>
  );
}
