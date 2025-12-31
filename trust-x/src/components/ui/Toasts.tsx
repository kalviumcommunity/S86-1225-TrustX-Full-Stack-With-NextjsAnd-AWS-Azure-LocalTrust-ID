"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function Toasts() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { borderRadius: 8, padding: '8px 12px' },
      }}
      containerStyle={{ top: 24 }}
    />
  );
}
