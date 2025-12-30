export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-6 animate-slide-in">
        {/* Animated logo/icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 bg-gradient-to-br from-accent-purple via-accent-pink to-accent-cyan rounded-2xl animate-float" />
            <div className="absolute inset-0 h-20 w-20 bg-gradient-to-br from-accent-cyan via-accent-purple to-accent-pink rounded-2xl animate-pulse-glow opacity-50" />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan animate-gradient">
            Loading TrustX
          </h2>
          <div className="flex justify-center items-center gap-2">
            <div className="h-2 w-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="h-2 w-2 bg-accent-pink rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="h-2 w-2 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan animate-shimmer" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
