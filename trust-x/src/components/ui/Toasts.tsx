"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export default function Toasts() {
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
