
"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import LanguageProvider from "@/components/LanguageProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}