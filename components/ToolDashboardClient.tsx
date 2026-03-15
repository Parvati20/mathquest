"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedTopicContent, getUiText } from "@/lib/language";
import { questionsData, TOTAL_QUESTION_COUNT } from "@/lib/questionsData";
import { topicsData } from "@/lib/topicsData";

interface TopicStats {
  solved: number;
  points: number;
}

interface ProgressData {
  totalSolved: number;
  totalPoints: number;
  topicProgress: Record<string, TopicStats>;
}

type Props = { session: Session };

const TOPICS = [
  { id: "number-patterns",  icon: "🔢", color: "from-blue-500 to-cyan-400",      border: "border-blue-200/50", glow: "shadow-blue-200/60" },
  { id: "percentage",       icon: "💯", color: "from-orange-500 to-amber-400",   border: "border-orange-200/50", glow: "shadow-orange-200/60" },
  { id: "work-time",        icon: "⏰", color: "from-emerald-500 to-teal-400",    border: "border-emerald-200/50", glow: "shadow-emerald-200/60" },
  { id: "linear-equations", icon: "📐", color: "from-purple-500 to-fuchsia-400",  border: "border-purple-200/50", glow: "shadow-purple-200/60" },
  { id: "simple-interest",  icon: "💰", color: "from-yellow-500 to-orange-300",   border: "border-yellow-200/50", glow: "shadow-yellow-200/60" },
  { id: "profit-loss",      icon: "📉", color: "from-pink-500 to-rose-400",       border: "border-pink-200/50", glow: "shadow-pink-200/60" },
] as const;

const bannerMsg: Record<string, string> = {
  English: "You're doing great — every question makes you stronger! 🚀",
  Hindi:   "तुम कमाल कर रहे हो — हर सवाल तुम्हें और मजबूत बनाता है! 🚀",
  Marathi: "तुम्ही छान करत आहात — प्रत्येक प्रश्न तुम्हाला अजून मजबूत बनवतो! 🚀",
};

const tipMsg: Record<string, string> = {
  English: "Focus on one topic at a time — that is the secret!",
  Hindi:   "एक समय में एक विषय पर ध्यान दो — यही राज है!",
  Marathi: "एकावेळी एका विषयावर लक्ष द्या — हेच यशाचं रहस्य आहे!",
};

const helloLabel: Record<string, string> = {
  English: "Hey",
  Hindi: "नमस्ते",
  Marathi: "नमस्कार",
};

const qLabel: Record<string, string> = {
  English: "questions",
  Hindi:   "प्रश्न",
  Marathi: "प्रश्न",
};

export default function ToolDashboardClient({ session }: Props) {
  const { language } = useLanguage();
  const text = useMemo(() => getUiText(language), [language]);

  const [progress, setProgress] = useState<ProgressData>({
    totalSolved: 0,
    totalPoints: 0,
    topicProgress: {},
  });

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProgress(d))
      .catch(() => {});
  }, []);

  const profileName = useMemo(() => {
    return session.user?.name?.trim() || session.user?.email?.split("@")[0] || "Student";
  }, [session.user]);

  const totalPct =
    TOTAL_QUESTION_COUNT > 0
      ? Math.min(100, Math.round((progress.totalSolved / TOTAL_QUESTION_COUNT) * 100))
      : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      <DashboardSidebar
        session={session}
        totalPoints={progress.totalPoints}
      />
      <main className="relative ml-[260px] flex-1 overflow-hidden pb-20">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-5%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.025)_42%,_transparent_72%)] blur-2xl" />
        <div className="absolute right-[-10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.09)_0%,_rgba(59,130,246,0.025)_45%,_transparent_74%)] blur-3xl" />
        <div className="absolute bottom-[-12%] left-[24%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(255,138,101,0.08)_0%,_rgba(255,138,101,0.02)_48%,_transparent_72%)] blur-3xl" />
        <span className="animate-float absolute left-[11%] top-[14%] text-6xl font-black text-slate-300 opacity-10" style={{ animationDelay: "0s" }}>π</span>
        <span className="animate-float absolute right-[12%] top-[26%] text-5xl font-black text-slate-300 opacity-[0.08]" style={{ animationDelay: "1.2s" }}>√n</span>
        <span className="animate-float absolute left-[54%] top-[62%] text-6xl font-black text-slate-300 opacity-[0.09]" style={{ animationDelay: "2.1s" }}>∑</span>
      </div>

      {/* ── MOTIVATIONAL BANNER ── */}
      <div className="relative border-b border-white/40 bg-white/50 px-6 py-3 text-sm font-medium text-gray-600 backdrop-blur-xl">
        👍 {helloLabel[language] ?? helloLabel.English} {profileName}! {bannerMsg[language] ?? bannerMsg.English}
      </div>

      {/* ── HERO ── */}
      <header className="relative px-6 py-14 text-center">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/50 bg-white/55 px-6 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
        <div className="mb-5 inline-block rounded-full border border-[#E91E63]/15 bg-white/70 px-4 py-2 text-xs font-bold text-[#E91E63] shadow-sm backdrop-blur-md">
          ✨ {text.remember} ✨
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] bg-clip-text text-transparent">
            🎯 {text.pickPower}
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base text-gray-600 md:text-lg">{text.heroBody} 💪</p>

        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between text-sm font-bold">
            <span className="text-gray-500">🔥 {progress.totalSolved}/{TOTAL_QUESTION_COUNT} {text.solved}</span>
            <span className="text-yellow-600">⭐ {progress.totalPoints} {text.pts}</span>
          </div>
          <div className="relative h-5 w-full rounded-full bg-white/80 p-1 shadow-inner shadow-slate-200/50">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] shadow-[0_0_24px_rgba(233,30,99,0.30)] transition-all duration-700"
              style={{ width: `${totalPct}%` }}
            >
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)]" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">🎯 {tipMsg[language] ?? tipMsg.English}</p>
        </div>
        </div>
      </header>

      {/* ── SECTION LABEL ── */}
      <p className="mt-8 px-6 text-center text-sm font-bold text-gray-400">
        {text.tapTopic} →
      </p>

      {/* ── TOPIC CARDS ── */}
      <section className="relative mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic) => {
          const localized = getLocalizedTopicContent(
            topic.id as keyof typeof topicsData,
            language,
          );
          const solved = progress.topicProgress[topic.id]?.solved ?? 0;
          const pts = progress.topicProgress[topic.id]?.points ?? 0;
          const total = questionsData[topic.id]?.length ?? 0;
          const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0;

          return (
            <Link
              key={topic.id}
              href={`/${topic.id}`}
              className={`group block rounded-[1.75rem] border ${topic.border} bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-white/70 hover:shadow-[0_20px_45px_rgba(251,207,232,0.85)]`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${topic.color} text-2xl shadow-[0_12px_26px_rgba(0,0,0,0.12)] ${topic.glow} ring-8 ring-white/65 transition-transform duration-300 group-hover:scale-110`}>
                  {topic.icon}
                </div>
                <div>
                  <h3 className="font-black text-gray-800">{localized.title}</h3>
                  <p className="text-xs font-medium text-gray-400">
                    {solved}/{total} {qLabel[language] ?? "questions"} • ⭐ {pts} {text.pts}
                  </p>
                </div>
              </div>

              <div className="mb-2 h-3 w-full rounded-full bg-white/75 p-[3px] shadow-inner shadow-white/60">
                <div
                  className={`relative h-full rounded-full bg-gradient-to-r ${topic.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                >
                  <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">{pct}%</span>
                <span className="text-xs font-black text-[#E91E63] transition-colors group-hover:text-[#c2185b]">
                  {text.letsGo} →
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ── MOCK TEST ── */}
      <section className="relative mx-auto mt-16 max-w-xl px-6 pb-32 text-center">
        <h4 className="mb-2 text-xl font-black text-gray-800">🏆 {text.thinkReady}</h4>
        <p className="mb-6 text-sm text-gray-400">{text.mockBody}</p>
        <p className="mt-5 text-xs font-bold italic text-[#E91E63]">🔥 {text.keepGoing}</p>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-[#F8FAFC]/88 backdrop-blur-xl lg:left-[260px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#E91E63]">Challenge Ready</p>
            <p className="text-sm text-gray-400">{text.mockBody}</p>
          </div>
          <Link
            href="/mock-test"
            className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-8 py-3.5 text-base font-black text-white shadow-[0_20px_40px_rgba(233,30,99,0.24)] transition-all hover:scale-105"
          >
            🚀 🎫 {text.takeMock} →
          </Link>
        </div>
      </div>
    </main>
    </div>
  );
}
