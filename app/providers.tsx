"use client";
import { LanguageProvider } from "@/components/LanguageProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}