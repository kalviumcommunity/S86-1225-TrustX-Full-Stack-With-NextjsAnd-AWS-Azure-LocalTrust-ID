'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-gray-900 animate-slide-in">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-orange-200 dark:border-orange-800 p-8 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-yellow-100/20 to-red-100/20 dark:from-orange-900/10 dark:via-yellow-900/10 dark:to-red-900/10 animate-pulse pointer-events-none" />

        <div className="flex justify-center relative z-10">
          <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-float">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-pink-600">
            ⚡ Dashboard Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {error.message || 'Unable to load dashboard data. Please try again.'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <button
            onClick={reset}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Retry Dashboard
          </button>
          <a
            href="/"
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-center"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
