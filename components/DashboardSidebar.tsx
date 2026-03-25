"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import BrandLogo from "@/components/BrandLogo";
import type { AppLanguage } from "@/lib/language";

type Props = {
  session: Session;
  totalPoints: number;
  appearance?: "light" | "dark";
  currentTopic?: {
    title: string;
    icon: string;
  };
};

const LANG_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "English", label: "EN" },
  { value: "Hindi", label: "हि" },
  { value: "Marathi", label: "म" },
];

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M6 9H4a2 2 0 000 4h2" />
    <path d="M18 9h2a2 2 0 100 4h-2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M17 5H7v4a5 5 0 0010 0V5z" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function DashboardSidebar({ session, totalPoints, appearance = "light", currentTopic }: Props) {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const dark = appearance === "dark";

  const profileName = useMemo(
    () => session.user?.name?.trim() || session.user?.email?.split("@")[0] || "Student",
    [session.user],
  );

  const initials = useMemo(
    () =>
      profileName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "S",
    [profileName],
  );

  const isPracticeArea =
    pathname !== "/" &&
    pathname !== "/tool" &&
    !pathname.startsWith("/mock-test") &&
    !pathname.startsWith("/login");

  const navItems = [
    { label: "Home", href: "/", icon: <HomeIcon />, active: pathname === "/" },
    { label: "Dashboard", href: "/tool", icon: <DashboardIcon />, active: pathname === "/tool" },
    { label: "Practice", href: "/number-patterns", icon: <BookIcon />, active: isPracticeArea },
    { label: "Mock Test", href: "/mock-test", icon: <TrophyIcon />, active: pathname === "/mock-test" },
  ];

  return (
    <aside className={`hidden lg:flex fixed left-0 top-0 z-50 h-screen w-[260px] flex-col border-r backdrop-blur-xl ${dark ? "border-white/10 bg-[#5F6775] shadow-[18px_0_60px_rgba(15,23,42,0.38)]" : "border-gray-100 bg-white/78 shadow-[18px_0_50px_rgba(15,23,42,0.06)]"}` }>

      <div className={`pointer-events-none absolute inset-y-0 right-0 w-px ${dark ? "bg-white/10" : "bg-gray-100"}`} />
      <div className="pointer-events-none absolute right-[-40px] top-20 h-48 w-48 rounded-full bg-[#E91E63]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-30px] bottom-24 h-36 w-36 rounded-full bg-sky-300/10 blur-3xl" />

      {/* ── LOGO + POINTS ── */}
      <div className={`border-b px-5 py-5 ${dark ? "border-white/10" : "border-gray-100"}`}>
        <Link href="/tool" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E63] to-[#FF4081] text-white font-black text-base shadow-[0_12px_24px_rgba(233,30,99,0.25)]">
            M
          </div>
          <div>
            <BrandLogo />
            <span className={`${dark ? "text-white/30" : "text-slate-400"} text-[9px] font-semibold uppercase tracking-[0.2em]`}>Math AI</span>
          </div>
        </Link>

        {/* Points badge */}
        <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-md ${dark ? "border-white/5 bg-white/5" : "border-white/60 bg-white/80 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"}`}>
          <span className="text-base">🏆</span>
          <div>
            <p className={`${dark ? "text-white/30" : "text-slate-400"} text-[9px] font-semibold uppercase tracking-wider`}>Total Points</p>
            <p className={`${dark ? "text-white" : "text-slate-900"} font-black text-sm leading-none mt-0.5`}>{totalPoints}</p>
          </div>
        </div>
      </div>

      {/* ── NAV ITEMS ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className={`px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? "text-white/20" : "text-slate-400"}`}>Navigation</p>
        {navItems.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-200 ${
              item.active
                ? (dark
                  ? "border border-[#E91E63]/30 bg-[#E91E63]/16 text-[#ff74a5] shadow-[0_0_0_1px_rgba(233,30,99,0.1),0_0_24px_rgba(233,30,99,0.26)]"
                  : "border border-[#E91E63]/20 bg-white/90 text-[#E91E63] shadow-[0_0_0_1px_rgba(233,30,99,0.08),0_12px_28px_rgba(233,30,99,0.16)]")
                : (dark ? "text-white/40 hover:bg-white/5 hover:text-white/80" : "text-slate-500 hover:bg-white/70 hover:text-slate-900")
            }`}
          >
            <span className={`transition-colors ${item.active ? "drop-shadow-[0_0_8px_rgba(233,30,99,0.8)]" : ""} ${item.active ? (dark ? "text-[#ff74a5]" : "text-[#E91E63]") : (dark ? "group-hover:text-white/80" : "group-hover:text-slate-900")}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.active && (
              <span className={`ml-auto h-2 w-2 rounded-full ${dark ? "bg-[#ff74a5]" : "bg-[#E91E63]"} shadow-[0_0_10px_rgba(233,30,99,0.5)]`} />
            )}
          </Link>
        ))}

        {currentTopic ? (
          <div className={`mt-5 rounded-2xl border p-3 backdrop-blur-md ${dark ? "border-[#E91E63]/25 bg-[#E91E63]/10 shadow-[0_0_24px_rgba(233,30,99,0.18)]" : "border-[#E91E63]/16 bg-white/78 shadow-[0_16px_34px_rgba(233,30,99,0.08)]"}`}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#E91E63]">Current Topic</p>
            <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${dark ? "border-white/10 bg-white/5" : "border-gray-100 bg-white/90"}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#FF4081] text-lg shadow-[0_12px_24px_rgba(233,30,99,0.28)]">
                {currentTopic.icon}
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>{currentTopic.title}</p>
                <p className={`text-[10px] ${dark ? "text-white/40" : "text-slate-400"}`}>Learning Mode</p>
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {/* ── BOTTOM ── */}
      <div className={`border-t px-4 py-4 space-y-4 ${dark ? "border-white/10" : "border-gray-100"}`}>

        {/* Language selector */}
        <div>
          <p className={`mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? "text-white/20" : "text-slate-400"}`}>Language</p>
          <div className={`flex gap-1 rounded-xl border p-1 backdrop-blur-md ${dark ? "border-white/5 bg-white/5" : "border-gray-100 bg-white/88"}`}>
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  language === opt.value
                    ? "bg-[#E91E63] text-white shadow-[0_10px_24px_rgba(233,30,99,0.28)]"
                    : (dark ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50")
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px ${dark ? "bg-white/10" : "bg-gray-100"}`} />

        {/* Profile + Logout */}
        <div className={`flex items-center gap-2.5 rounded-xl border p-2.5 backdrop-blur-md ${dark ? "border-white/5 bg-white/5" : "border-gray-100 bg-white/88"}`}>
          {session.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={profileName}
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-[#E91E63]/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E91E63]/20 text-xs font-black text-[#E91E63]">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className={`truncate text-xs font-bold leading-none ${dark ? "text-white/80" : "text-slate-900"}`}>{profileName}</p>
            <p className={`mt-0.5 truncate text-[10px] leading-none ${dark ? "text-white/30" : "text-slate-400"}`}>{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Logout"
            className={`flex-shrink-0 rounded-lg p-1.5 transition-all hover:bg-[#E91E63]/10 hover:text-[#E91E63] ${dark ? "text-white/30" : "text-slate-400"}`}
          >
            <LogoutIcon />
          </button>
        </div>

      </div>
    </aside>
  );
}
