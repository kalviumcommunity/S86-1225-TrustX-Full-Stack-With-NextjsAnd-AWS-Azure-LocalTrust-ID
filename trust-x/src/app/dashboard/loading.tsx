export default function Loading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-slide-in">
      {/* Page title skeleton */}
      <div className="animate-pulse">
        <div className="h-10 bg-gradient-to-r from-accent-purple/20 via-accent-pink/20 to-accent-cyan/20 rounded-lg w-1/4 mb-2 animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 rounded w-1/2" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-transparent shadow-lg"
            style={{
              animationDelay: `${i * 0.1}s`,
              borderImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3), rgba(6, 182, 212, 0.3)) 1'
            }}
          >
            <div className="h-4 bg-gradient-to-r from-accent-purple/30 to-accent-pink/30 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="animate-pulse p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-accent-purple/20 dark:border-accent-cyan/20 shadow-lg">
        <div className="h-6 bg-gradient-to-r from-accent-purple/30 to-accent-pink/30 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gradient-to-br from-accent-cyan/10 via-accent-purple/10 to-accent-pink/10 rounded-lg flex items-end justify-around p-4 gap-2">
          {[40, 70, 50, 80, 60, 90, 45].map((height, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-accent-purple/40 to-accent-cyan/40 rounded-t animate-pulse"
              style={{ height: `${height}%`, width: '12%', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 rounded-lg border border-accent-purple/30 dark:border-accent-cyan/30 animate-pulse-glow">
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
            Loading dashboard...
          </span>
        </div>
      </div>
    </div>
  );
}
