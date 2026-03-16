
"use client";

import React from "react";
import LanguageProvider from "@/components/LanguageProvider"; // Default import (bina braces)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}