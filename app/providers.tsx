// "use client";
// import { LanguageProvider } from "@/components/LanguageProvider";

// export function Providers({ children }: { children: React.ReactNode }) {
//   return <LanguageProvider>{children}</LanguageProvider>;
// }


"use client";

import React from "react";
import LanguageProvider from "@/components/LanguageProvider"; // Default import (bina braces)

// Named export (Isi wajah se layout mein { Providers } kaam karega)
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}