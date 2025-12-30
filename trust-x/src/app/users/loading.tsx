export default function Loading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-slide-in">
      {/* Header skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gradient-to-r from-accent-purple/20 via-accent-pink/20 to-accent-cyan/20 rounded-lg w-1/3 animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-accent-cyan/20 via-accent-purple/20 to-accent-pink/20 rounded w-2/3 animate-shimmer" />
      </div>

      {/* User cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse p-4 md:p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-accent-purple/20 dark:border-accent-cyan/20 shadow-lg"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent-purple/30 to-accent-pink/30 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30 rounded w-3/4" />
                <div className="h-3 bg-gradient-to-r from-accent-pink/30 to-accent-cyan/30 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Loading message */}
      <div className="flex justify-center items-center gap-3 p-4 bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 rounded-lg border border-accent-purple/30 dark:border-accent-cyan/30">
        <svg
          className="animate-spin h-5 w-5 text-accent-purple dark:text-accent-cyan"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan">
          Loading users...
        </span>
      </div>
    </div>
  );
}
