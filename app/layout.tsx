import "./globals.css";
import Image from "next/image";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <div className="pointer-events-none fixed bottom-3 right-3 z-[60] hidden items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 shadow-[0_10px_26px_rgba(15,23,42,0.12)] backdrop-blur-md sm:flex">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Powered by</span>
          <Image src="/ng-logo-horizontal.avif" alt="NavGurukul" width={90} height={22} className="h-5 w-auto object-contain" />
        </div>
      </body>
    </html>
  );
}