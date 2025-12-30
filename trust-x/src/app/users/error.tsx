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
    // Log error to an error reporting service
    console.error('Users page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-red-900/10 dark:to-gray-900 animate-slide-in">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-red-200 dark:border-red-800 p-8 space-y-6 relative overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-orange-100/20 to-pink-100/20 dark:from-red-900/10 dark:via-orange-900/10 dark:to-pink-900/10 animate-pulse pointer-events-none" />

        {/* Error icon */}
        <div className="flex justify-center relative z-10">
          <div className="relative">
            <div className="h-20 w-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse-glow">
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
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error content */}
        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-pink-600">
            ⚠️ Oops! Something Went Wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {error.message || 'Failed to load users. This could be a network issue or server error.'}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 relative z-10">
          <button
            onClick={reset}
            className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 hover:from-red-600 hover:via-orange-600 hover:to-pink-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 group"
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
            Try Again
          </button>
          <a
            href="/"
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-center"
          >
            ← Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
