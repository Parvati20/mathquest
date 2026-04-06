"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useLanguage } from "@/components/LanguageProvider";
import type { AppLanguage } from "@/lib/language";
import { getLocalizedTopicContent } from "@/lib/language";
import { topicsData } from "@/lib/topicsData";
import type { UserProgress } from "@/lib/userProgress";

type Props = {
  session: Session;
  progress: UserProgress;
};

function Donut({ value, label, tone }: { value: number; label: string; tone: "green" | "pink" }) {
  const clamped = Math.max(0, Math.min(value, 100));
  const color = tone === "green" ? "#10B981" : "#E91E63";

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${clamped}%, rgba(148,163,184,0.16) 0%)` }}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-sm font-black text-slate-700">{clamped}%</div>
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function formatSessionDate(createdAt?: string | Date) {
  if (!createdAt) return "Unknown date";

  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatTime(createdAt?: string | Date) {
  if (!createdAt) return "";

  const date = new Date(createdAt);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const progressText: Record<AppLanguage, {
  historyKicker: string;
  historyTitle: string;
  clearHistory: string;
  clearing: string;
  backToDashboard: string;
  totalAttempts: string;
  correct: string;
  wrong: string;
  totalMarks: string;
  overallAccuracy: string;
  bestMockPercent: string;
  mockSummary: string;
  attempts: string;
  bestScore: string;
  tip: string;
  topicWisePerformance: string;
  topic: string;
  marks: string;
  accuracy: string;
  recentPractice: string;
  practicedTopic: string;
  oldPracticeUnavailable: string;
  noPractice: string;
  mockHistory: string;
  mockAttempt: string;
  score: string;
  weakTopics: string;
  noWeakTopics: string;
  oldMockUnavailable: string;
  noMockAttempts: string;
  clearConfirm: string;
  clearFailed: string;
  today: string;
  yesterday: string;
}> = {
  English: {
    historyKicker: "Student Progress History",
    historyTitle: "Detailed Learning Analytics",
    clearHistory: "Clear History",
    clearing: "Clearing...",
    backToDashboard: "Back to Dashboard",
    totalAttempts: "Total Attempts",
    correct: "Correct",
    wrong: "Wrong",
    totalMarks: "Total Marks",
    overallAccuracy: "Overall Accuracy",
    bestMockPercent: "Best Mock %",
    mockSummary: "Mock Interview Summary",
    attempts: "Attempts",
    bestScore: "Best Score",
    tip: "Tip: Solve weak topics to improve mock performance.",
    topicWisePerformance: "Topic-wise Performance",
    topic: "Topic",
    marks: "Marks",
    accuracy: "Accuracy",
    recentPractice: "Recent Practice Sessions",
    practicedTopic: "Practiced topic",
    oldPracticeUnavailable: "Detailed practice history is unavailable for older attempts. New attempts will appear here.",
    noPractice: "No practice sessions yet.",
    mockHistory: "Mock Interview History",
    mockAttempt: "Mock Attempt",
    score: "Score",
    weakTopics: "Weak Topics",
    noWeakTopics: "No weak topics recorded",
    oldMockUnavailable: "Detailed mock history is unavailable for older attempts. New attempts will appear here.",
    noMockAttempts: "No mock attempts yet.",
    clearConfirm: "Are you sure? This will reset all your points, attempts, mock history, and practice history.",
    clearFailed: "Could not clear progress. Please try again.",
    today: "Today",
    yesterday: "Yesterday",
  },
  Hindi: {
    historyKicker: "छात्र प्रगति इतिहास",
    historyTitle: "विस्तृत सीखने का विश्लेषण",
    clearHistory: "इतिहास साफ करें",
    clearing: "साफ किया जा रहा है...",
    backToDashboard: "डैशबोर्ड पर वापस",
    totalAttempts: "कुल प्रयास",
    correct: "सही",
    wrong: "गलत",
    totalMarks: "कुल अंक",
    overallAccuracy: "कुल सटीकता",
    bestMockPercent: "सर्वश्रेष्ठ मॉक %",
    mockSummary: "मॉक इंटरव्यू सारांश",
    attempts: "प्रयास",
    bestScore: "सर्वश्रेष्ठ स्कोर",
    tip: "सुझाव: मॉक प्रदर्शन सुधारने के लिए कमजोर विषय हल करें।",
    topicWisePerformance: "विषयवार प्रदर्शन",
    topic: "विषय",
    marks: "अंक",
    accuracy: "सटीकता",
    recentPractice: "हालिया अभ्यास सत्र",
    practicedTopic: "अभ्यास किया गया विषय",
    oldPracticeUnavailable: "पुराने प्रयासों का विस्तृत अभ्यास इतिहास उपलब्ध नहीं है। नए प्रयास यहां दिखेंगे।",
    noPractice: "अभी तक कोई अभ्यास सत्र नहीं।",
    mockHistory: "मॉक इंटरव्यू इतिहास",
    mockAttempt: "मॉक प्रयास",
    score: "स्कोर",
    weakTopics: "कमजोर विषय",
    noWeakTopics: "कोई कमजोर विषय दर्ज नहीं",
    oldMockUnavailable: "पुराने प्रयासों का विस्तृत मॉक इतिहास उपलब्ध नहीं है। नए प्रयास यहां दिखेंगे।",
    noMockAttempts: "अभी तक कोई मॉक प्रयास नहीं।",
    clearConfirm: "क्या आप निश्चित हैं? इससे आपके सभी अंक, प्रयास, मॉक इतिहास और अभ्यास इतिहास रीसेट हो जाएंगे।",
    clearFailed: "प्रगति साफ नहीं हो सकी। कृपया फिर प्रयास करें।",
    today: "आज",
    yesterday: "कल",
  },
  Marathi: {
    historyKicker: "विद्यार्थी प्रगती इतिहास",
    historyTitle: "सविस्तर शिकण्याचे विश्लेषण",
    clearHistory: "इतिहास साफ करा",
    clearing: "साफ होत आहे...",
    backToDashboard: "डॅशबोर्डवर परत",
    totalAttempts: "एकूण प्रयत्न",
    correct: "बरोबर",
    wrong: "चुकीचे",
    totalMarks: "एकूण गुण",
    overallAccuracy: "एकूण अचूकता",
    bestMockPercent: "सर्वोत्तम मॉक %",
    mockSummary: "मॉक इंटरव्यू सारांश",
    attempts: "प्रयत्न",
    bestScore: "सर्वोत्तम स्कोर",
    tip: "सूचना: मॉक कामगिरी सुधारण्यासाठी कमकुवत विषय सोडवा.",
    topicWisePerformance: "विषयनिहाय कामगिरी",
    topic: "विषय",
    marks: "गुण",
    accuracy: "अचूकता",
    recentPractice: "अलीकडील सराव सत्रे",
    practicedTopic: "सराव केलेला विषय",
    oldPracticeUnavailable: "जुन्या प्रयत्नांचा सविस्तर सराव इतिहास उपलब्ध नाही. नवीन प्रयत्न येथे दिसतील.",
    noPractice: "अजून सराव सत्र नाही.",
    mockHistory: "मॉक इंटरव्यू इतिहास",
    mockAttempt: "मॉक प्रयत्न",
    score: "स्कोर",
    weakTopics: "कमकुवत विषय",
    noWeakTopics: "कमकुवत विषय नोंदलेले नाहीत",
    oldMockUnavailable: "जुन्या प्रयत्नांचा सविस्तर मॉक इतिहास उपलब्ध नाही. नवीन प्रयत्न येथे दिसतील.",
    noMockAttempts: "अजून मॉक प्रयत्न नाही.",
    clearConfirm: "तुम्हाला खात्री आहे का? यामुळे तुमचे सर्व गुण, प्रयत्न, मॉक इतिहास आणि सराव इतिहास रीसेट होतील.",
    clearFailed: "प्रगती साफ करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
    today: "आज",
    yesterday: "काल",
  },
};

export default function ProgressHistoryClient({ session, progress }: Props) {
  const { language } = useLanguage();
  const t = progressText[language];
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const totalAttempts = progress.totalAttempts ?? 0;
  const totalSolved = progress.totalSolved ?? 0;
  const totalWrong = progress.totalWrong ?? 0;
  const totalPoints = progress.totalPoints ?? 0;
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;
  const latestPracticeTopics = (() => {
    const seen = new Set<string>();
    const uniqueTopics: Array<{ topicId: string; createdAt?: string | Date }> = [];

    for (const sessionItem of [...(progress.practiceSessions ?? [])].reverse()) {
      if (seen.has(sessionItem.topicId)) {
        continue;
      }

      seen.add(sessionItem.topicId);
      uniqueTopics.push({ topicId: sessionItem.topicId, createdAt: sessionItem.createdAt });

      if (uniqueTopics.length >= 12) {
        break;
      }
    }

    return uniqueTopics;
  })();
  const latestMocks = [...(progress.mockHistory ?? [])].reverse().slice(0, 10);

  const getTopicTitle = (topicId: string) =>
    getLocalizedTopicContent(topicId as keyof typeof topicsData, language).title ?? topicId;

  const topicRows = (Object.keys(topicsData) as Array<keyof typeof topicsData>).map((topicId) => {
    const stats = progress.topicProgress?.[topicId] ?? { solved: 0, attempts: 0, wrong: 0, points: 0 };
    const accuracy = stats.attempts > 0 ? Math.round((stats.solved / stats.attempts) * 100) : 0;

    return {
      topicId,
      title: getLocalizedTopicContent(topicId, language).title,
      solved: stats.solved,
      attempts: stats.attempts,
      wrong: stats.wrong ?? Math.max(0, stats.attempts - stats.solved),
      points: stats.points,
      accuracy,
    };
  });

  const clearHistory = async () => {
    const shouldClear = window.confirm(
      t.clearConfirm,
    );

    if (!shouldClear) {
      return;
    }

    try {
      setIsClearing(true);
      const response = await fetch("/api/progress/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to clear progress");
      }

      router.refresh();
    } catch {
      window.alert(t.clearFailed);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <DashboardSidebar session={session} totalPoints={totalPoints} />

      <main className="ml-0 flex-1 pb-24 lg:ml-[260px] lg:pb-16">
        <header className="border-b border-white/70 bg-white/75 px-4 py-6 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-3 sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#E91E63]">{t.historyKicker}</p>
              <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-3xl">{t.historyTitle}</h1>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  void clearHistory();
                }}
                disabled={isClearing}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isClearing ? t.clearing : t.clearHistory}
              </button>
              <Link href="/tool" className="w-full rounded-xl border border-[#E91E63]/30 bg-white px-4 py-2 text-center text-sm font-bold text-[#E91E63] hover:bg-[#fff1f6] sm:w-auto">
                {t.backToDashboard}
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{t.totalAttempts}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{totalAttempts}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">{t.correct}</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{totalSolved}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-700">{t.wrong}</p>
            <p className="mt-2 text-2xl font-black text-rose-700">{totalWrong}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">{t.totalMarks}</p>
            <p className="mt-2 text-2xl font-black text-amber-700">{totalPoints}</p>
          </div>
        </section>

        <section className="mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-3">
          <Donut value={overallAccuracy} label={t.overallAccuracy} tone="green" />
          <Donut value={progress.mockBestScore > 0 ? Math.round((progress.mockBestScore / 80) * 100) : 0} label={t.bestMockPercent} tone="pink" />
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{t.mockSummary}</p>
            <p className="mt-3 text-sm text-slate-500">{t.attempts}: <span className="font-black text-slate-800">{progress.mockAttempts ?? 0}</span></p>
            <p className="mt-1 text-sm text-slate-500">{t.bestScore}: <span className="font-black text-slate-800">{progress.mockBestScore ?? 0}/80</span></p>
            <p className="mt-4 text-xs text-slate-400">{t.tip}</p>
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">{t.topicWisePerformance}</h2>
            <div className="mt-3 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-3 py-2">{t.topic}</th>
                    <th className="px-3 py-2">{t.attempts}</th>
                    <th className="px-3 py-2">{t.correct}</th>
                    <th className="px-3 py-2">{t.wrong}</th>
                    <th className="px-3 py-2">{t.marks}</th>
                    <th className="px-3 py-2">{t.accuracy}</th>
                  </tr>
                </thead>
                <tbody>
                  {topicRows.map((row) => (
                    <tr key={row.topicId} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.title}</td>
                      <td className="px-3 py-2 text-slate-600">{row.attempts}</td>
                      <td className="px-3 py-2 text-emerald-700">{row.solved}</td>
                      <td className="px-3 py-2 text-rose-700">{row.wrong}</td>
                      <td className="px-3 py-2 text-amber-700">{row.points}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${row.accuracy >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {row.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 space-y-2 md:hidden">
              {topicRows.map((row) => (
                <div key={`mobile-${row.topicId}`} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{row.title}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${row.accuracy >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {row.accuracy}%
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <p className="text-slate-500">{t.attempts}: <span className="font-bold text-slate-700">{row.attempts}</span></p>
                    <p className="text-emerald-600">{t.correct}: <span className="font-bold">{row.solved}</span></p>
                    <p className="text-rose-600">{t.wrong}: <span className="font-bold">{row.wrong}</span></p>
                    <p className="text-amber-600">{t.marks}: <span className="font-bold">{row.points}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-4 px-4 pb-10 sm:px-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <h3 className="text-base font-black text-slate-900">{t.recentPractice}</h3>
            <div className="mt-3 space-y-2">
              {latestPracticeTopics.length > 0 ? latestPracticeTopics.map((sessionItem, idx) => (
                <div key={`${sessionItem.topicId}-${idx}`} className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{getTopicTitle(sessionItem.topicId)}</p>
                      <p className="mt-1 text-slate-500">{t.practicedTopic}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      {formatSessionDate(sessionItem.createdAt)
                        .replace("Today", t.today)
                        .replace("Yesterday", t.yesterday)}
                    </span>
                  </div>
                  {sessionItem.createdAt && <p className="mt-1 text-xs text-slate-400">{formatTime(sessionItem.createdAt)}</p>}
                </div>
              )) : (
                <p className="text-sm text-slate-400">
                  {totalAttempts > 0
                    ? t.oldPracticeUnavailable
                    : t.noPractice}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <h3 className="text-base font-black text-slate-900">{t.mockHistory}</h3>
            <div className="mt-3 space-y-2">
              {latestMocks.length > 0 ? latestMocks.map((mock, idx) => (
                <div key={`mock-${idx}`} className="rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-600">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{t.mockAttempt} #{(progress.mockAttempts ?? 0) - idx}</p>
                      <p className="mt-1">{t.score} {mock.score}/80 • {t.correct} {mock.correctCount} • {t.wrong} {mock.wrongCount} • {t.accuracy} {mock.accuracy}%</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      {formatSessionDate(mock.createdAt)
                        .replace("Today", t.today)
                        .replace("Yesterday", t.yesterday)}
                    </span>
                  </div>
                  {mock.createdAt && <p className="mt-1 text-xs text-slate-400">{formatTime(mock.createdAt)}</p>}
                  <div className="mt-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t.weakTopics}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(mock.weakTopicIds ?? []).length > 0 ? (
                        mock.weakTopicIds!.map((topicId) => (
                          <span
                            key={`${mock.createdAt?.toString() ?? "mock"}-${topicId}`}
                            className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700"
                          >
                            {getTopicTitle(topicId)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          {t.noWeakTopics}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400">
                  {(progress.mockAttempts ?? 0) > 0
                    ? t.oldMockUnavailable
                    : t.noMockAttempts}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
