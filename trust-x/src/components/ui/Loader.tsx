"use client";

import React from "react";

export default function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 dark:from-accent-purple/20 dark:via-accent-pink/20 dark:to-accent-cyan/20 animate-gradient border border-accent-purple/30 dark:border-accent-cyan/30">
      <svg
        className="animate-spin h-5 w-5 text-accent-purple dark:text-accent-cyan drop-shadow-lg"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan animate-gradient">{label}</span>
    </div>
  );
}
