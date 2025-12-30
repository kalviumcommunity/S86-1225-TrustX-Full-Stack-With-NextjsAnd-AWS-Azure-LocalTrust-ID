'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestStatesPage() {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan p-1 rounded-xl">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan mb-4">
            🧪 Test Loading & Error States
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Use this page to test loading skeletons and error boundaries in different routes.
          </p>
        </div>
      </div>

      {showInstructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 relative animate-slide-in">
          <button
            onClick={() => setShowInstructions(false)}
            className="absolute top-4 right-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            ✕
          </button>
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 Testing Instructions
          </h2>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li><strong>1. Test Loading States:</strong> Open Chrome DevTools → Network tab → Throttling → Slow 3G</li>
            <li><strong>2. Navigate:</strong> Click the test links below to see loading skeletons</li>
            <li><strong>3. Test Errors:</strong> Open browser console and watch for error logs when clicking "Trigger Error" links</li>
            <li><strong>4. Try Retry:</strong> Click "Try Again" button in error screens to test recovery</li>
          </ol>
        </div>
      )}

      {/* Loading State Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-accent-purple/20 dark:border-accent-cyan/20">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          ⏳ Loading State Tests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/users"
            className="p-4 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 hover:from-accent-purple/20 hover:to-accent-pink/20 rounded-lg border-2 border-accent-purple/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <h3 className="font-semibold text-accent-purple dark:text-accent-cyan mb-2">👥 Users Page</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View user cards skeleton with gradient animations
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="p-4 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10 hover:from-accent-cyan/20 hover:to-accent-purple/20 rounded-lg border-2 border-accent-cyan/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <h3 className="font-semibold text-accent-cyan dark:text-accent-pink mb-2">📊 Dashboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View stats and chart skeletons with pulse effects
            </p>
          </Link>
        </div>
      </div>

      {/* Error State Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-red-200 dark:border-red-800">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          ⚠️ Error Boundary Tests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">🚨 Simulate User Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              To test: Edit <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">users/page.tsx</code> and add:
            </p>
            <code className="block text-xs bg-gray-900 text-green-400 p-2 rounded">
              throw new Error('Test error');
            </code>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">⚡ Simulate Dashboard Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              To test: Edit <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">dashboard/page.tsx</code> and add:
            </p>
            <code className="block text-xs bg-gray-900 text-green-400 p-2 rounded">
              throw new Error('Dashboard failed');
            </code>
          </div>
        </div>
      </div>

      {/* Manual Delay Test */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-accent-pink/20 dark:border-accent-pink/20">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          ⏱️ Add Artificial Delay
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          To see loading states more clearly, add this to any page component:
        </p>
        <code className="block text-xs bg-gray-900 text-green-400 p-3 rounded whitespace-pre">
{`// At the top of your component
await new Promise(resolve => setTimeout(resolve, 2000));`}
        </code>
      </div>

      {/* Network Throttling Guide */}
      <div className="bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 rounded-xl p-6 border-2 border-accent-purple/30 dark:border-accent-cyan/30">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">🌐 Network Throttling</h2>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li><strong>1.</strong> Open Chrome DevTools (F12)</li>
          <li><strong>2.</strong> Go to Network tab</li>
          <li><strong>3.</strong> Select throttling dropdown (usually says "No throttling")</li>
          <li><strong>4.</strong> Choose "Slow 3G" or "Fast 3G"</li>
          <li><strong>5.</strong> Navigate to test pages and observe loading skeletons</li>
        </ol>
      </div>
    </div>
  );
}
