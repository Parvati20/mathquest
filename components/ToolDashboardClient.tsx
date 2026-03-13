"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedTopicContent, getUiText } from "@/lib/language";
import { questionsData, TOTAL_QUESTION_COUNT } from "@/lib/questionsData";
import { topicsData } from "@/lib/topicsData";

interface TopicStats {
  solved: number;
  attempts: number;
  points: number;
}

interface ProgressData {
  totalSolved: number;
  totalPoints: number;
  topicProgress: Record<string, TopicStats>;
}

type ToolDashboardClientProps = {
  session: Session;
};

export default function ToolDashboardClient({ session }: ToolDashboardClientProps) {
  const { language } = useLanguage();
  const [progress, setProgress] = useState<ProgressData>({
    totalSolved: 0,
    totalPoints: 0,
    topicProgress: {},
  });
  const text = getUiText(language);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProgress(data);
        }
      })
      .catch(() => {
        // Ignore transient client fetch failures for non-critical progress stats.
      });
  }, []);

  const topics = [
    { id: "number-patterns", icon: "🔢", color: "bg-blue-500", border: "border-blue-100" },
    { id: "percentage", icon: "💯", color: "bg-orange-500", border: "border-orange-100" },
    { id: "work-time", icon: "⏰", color: "bg-emerald-500", border: "border-emerald-100" },
    { id: "linear-equations", icon: "📐", color: "bg-purple-500", border: "border-purple-100" },
    { id: "simple-interest", icon: "💰", color: "bg-yellow-500", border: "border-yellow-100" },
    { id: "profit-loss", icon: "📉", color: "bg-pink-500", border: "border-pink-100" },
  ] as const;

  const profileName = useMemo(() => {
    const userName = session.user?.name?.trim();
    if (userName) {
      return userName;
    }

    const email = session.user?.email?.trim();
    if (email) {
      return email.split("@")[0];
    }

    return "Student";
  }, [session.user?.email, session.user?.name]);

  const initials = useMemo(() => {
    const parts = profileName.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "S";
  }, [profileName]);

  return (
    <main className="min-h-screen bg-[#FFFBF5] font-sans pb-20">
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-white/80 px-8 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-400 to-green-400" />
          <span className="font-bold text-gray-700">{text.appName}</span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelect className="bg-white" />
          <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
            🏆 {progress.totalPoints}
          </div>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-orange-200">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={profileName}
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600">
                  {initials}
                </span>
              )}
              <span className="max-w-28 truncate text-left font-semibold">{profileName}</span>
              <span className="text-xs text-gray-400 transition-transform group-open:rotate-180">▾</span>
            </summary>

            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/70">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={profileName}
                    className="h-12 w-12 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-600">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-800">{profileName}</p>
                  <p className="truncate text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                {text.logout} 🚪
              </button>
            </div>
          </details>
        </div>
      </nav>

      <header className="mt-12 px-4 text-center">
        <div className="mb-6 inline-block rounded-full bg-orange-100 px-4 py-2 text-xs font-bold text-orange-600">
          ✨ {text.remember} ✨
        </div>
        <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-black text-gray-800 md:text-5xl">
          🎯 {text.pickPower}
        </h1>
        <p className="mx-auto max-w-lg leading-relaxed text-gray-500">
          {text.heroBody} 💪
        </p>
        <p className="mt-8 text-sm font-bold text-gray-500">{text.tapTopic} →</p>

        <div className="mt-8 flex justify-center gap-8 text-sm font-bold text-gray-400">
          <span className="flex items-center gap-1">🔥 {progress.totalSolved}/{TOTAL_QUESTION_COUNT} {text.solved}</span>
          <span className="flex items-center gap-1">⭐ {progress.totalPoints} {text.pts}</span>
        </div>
      </header>

      <section className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const localizedTopic = getLocalizedTopicContent(topic.id as keyof typeof topicsData, language);
          const solved = progress.topicProgress[topic.id]?.solved ?? 0;
          const points = progress.topicProgress[topic.id]?.points ?? 0;
          const totalQuestions = questionsData[topic.id]?.length ?? 0;
          const progressPercent = Math.min(100, Math.round((solved / (totalQuestions || 1)) * 100));

          return (
            <Link
              key={topic.id}
              href={`/${topic.id}`}
              className={`group relative block overflow-hidden rounded-[32px] border-2 ${topic.border} bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="mb-6 flex items-start gap-4">
                <div className={`${topic.color} flex h-14 w-14 items-center justify-center rounded-2xl text-3xl text-white shadow-lg`}>
                  {topic.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">{localizedTopic.title}</h3>
                  <p className="text-xs font-medium text-gray-400">
                    {solved}/{totalQuestions} {text.solved} • ⭐ {points} {text.pts}
                  </p>
                </div>
              </div>

              <div className="mb-4 h-2 w-full rounded-full bg-gray-100">
                <div className={`${topic.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{progressPercent}%</span>
                <span className="flex items-center gap-1 text-xs font-black text-gray-800 transition-colors group-hover:text-orange-500">
                  {text.letsGo} →
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-20 px-6 text-center">
        <h4 className="mb-2 text-xl font-black text-gray-800">🏆 {text.thinkReady}</h4>
        <p className="mb-8 text-sm text-gray-400">{text.mockBody}</p>
        <Link
          href="/mock-test"
          className="mx-auto flex w-fit items-center gap-3 rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-10 py-5 text-lg font-black text-white shadow-xl shadow-orange-200 transition-all hover:scale-105"
        >
          🚀 🎫 {text.takeMock} →
        </Link>
        <p className="mt-6 text-xs font-bold italic text-orange-500">🔥 {text.keepGoing}</p>
      </section>
    </main>
  );
}