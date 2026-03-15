"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useLanguage } from "@/components/LanguageProvider";
import { getUiText } from "@/lib/language";

export default function MockTestIntroClient({ session }: { session: Session }) {
  const { language } = useLanguage();
  const text = getUiText(language);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    void fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { totalPoints?: number } | null) => {
        if (typeof data?.totalPoints === "number") {
          setPoints(data.totalPoints);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      <DashboardSidebar session={session} totalPoints={points} />

      <main className="relative ml-[260px] flex-1 overflow-hidden pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-6%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.025)_42%,_transparent_72%)] blur-2xl" />
          <div className="absolute right-[-8%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.09)_0%,_rgba(59,130,246,0.025)_45%,_transparent_74%)] blur-3xl" />
          <span className="animate-float absolute left-[18%] top-[20%] text-6xl font-black text-slate-300 opacity-10">π</span>
          <span className="animate-float absolute right-[18%] top-[26%] text-5xl font-black text-slate-300 opacity-[0.08]" style={{ animationDelay: "1.4s" }}>∑</span>
          <span className="animate-float absolute left-[22%] bottom-[20%] text-5xl opacity-[0.07]">⏱️</span>
          <span className="animate-float absolute right-[24%] bottom-[18%] text-5xl opacity-[0.07]" style={{ animationDelay: "2.1s" }}>✅</span>
        </div>

        <section className="relative mx-auto flex min-h-[78vh] max-w-4xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-[2rem] border border-white/60 bg-white/72 px-10 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63] to-[#FF8A65] text-4xl text-white shadow-[0_18px_35px_rgba(233,30,99,0.22)] ring-8 ring-white/70">
              📝
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              <span className="bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] bg-clip-text text-transparent">
                {text.mockInterview}
              </span>
            </h1>
            <p className="mt-3 text-gray-400">{text.twentyQuestions}</p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-400">{text.mockIntro}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63]/15 to-[#FF8A65]/20 text-2xl shadow-[0_0_20px_rgba(233,30,99,0.12)]">❓</div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#E91E63]">Questions</p>
                <p className="mt-2 text-2xl font-black text-gray-900">20</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63]/15 to-[#FF8A65]/20 text-2xl shadow-[0_0_20px_rgba(233,30,99,0.12)] animate-float">⏱️</div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#E91E63]">Duration</p>
                <p className="mt-2 text-2xl font-black text-gray-900">15m</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63]/15 to-[#FF8A65]/20 text-2xl shadow-[0_0_20px_rgba(233,30,99,0.12)]">✅</div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#E91E63]">Mode</p>
                <p className="mt-2 text-2xl font-black text-gray-900">Mixed</p>
              </div>
            </div>

            <Link href="/tool" className="mt-8 inline-flex text-sm font-semibold text-gray-400 transition-colors hover:text-[#E91E63]">
              ← {text.backToTopics}
            </Link>
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-[#F8FAFC]/88 backdrop-blur-xl lg:left-[260px]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#E91E63]">Mock Challenge</p>
              <p className="text-sm text-gray-400">{text.mockIntro}</p>
            </div>
            <Link
              href="/mock-test/start"
              className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-8 py-3.5 text-base font-black text-white shadow-[0_20px_40px_rgba(233,30,99,0.24)] transition-all hover:scale-105"
            >
              🚀 {text.takeMock} →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
