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
  attempts: number;
  wrong: number;
  points: number;
}

interface TopicEligibility {
  topicId: string;
  title: string;
  attempts: number;
  solved: number;
  accuracy: number;
  passed: boolean;
}

interface MockEligibility {
  canTakeMock: boolean;
  requiredAccuracy: number;
  passedTopics: number;
  totalTopics: number;
  topics: TopicEligibility[];
}

interface ProgressData {
  totalSolved: number;
  totalAttempts: number;
  totalWrong: number;
  totalPoints: number;
  topicProgress: Record<string, TopicStats>;
  mockEligibility?: MockEligibility;
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

const dashboardCopy: Record<string, {
  progressHistory: string;
  correct: string;
  wrong: string;
  attempts: string;
  accuracy: string;
  challengeReady: string;
  projectFlow: string;
  showInstructions: string;
  close: string;
  mockUnlockTitle: string;
  mockUnlockBody: string;
  retakeTitle: string;
  retakeBody: string;
  historyTitle: string;
  historyBody: string;
}> = {
  English: {
    progressHistory: "Student Progress History",
    correct: "Correct",
    wrong: "Wrong",
    attempts: "Attempts",
    accuracy: "Accuracy",
    challengeReady: "Challenge Ready",
    projectFlow: "Project Flow",
    showInstructions: "Show Instructions",
    close: "Close",
    mockUnlockTitle: "When Mock Opens",
    mockUnlockBody: "Solve all topics with at least 60% accuracy in each topic. Then the mock test becomes available.",
    retakeTitle: "Retake Rule",
    retakeBody: "After a mock, practice the weak topics shown in your result before you can take the mock again.",
    historyTitle: "How History Appears",
    historyBody: "The progress history page shows solved questions, wrong answers, accuracy, topic-wise growth, and past mock attempts.",
  },
  Hindi: {
    progressHistory: "छात्र प्रगति इतिहास",
    correct: "सही",
    wrong: "गलत",
    attempts: "प्रयास",
    accuracy: "सटीकता",
    challengeReady: "चुनौती के लिए तैयार",
    projectFlow: "प्रोजेक्ट फ्लो",
    showInstructions: "निर्देश दिखाएँ",
    close: "बंद करें",
    mockUnlockTitle: "मॉक कब खुलेगा",
    mockUnlockBody: "हर विषय में कम से कम 60% सटीकता के साथ सभी विषय पूरे करने पर मॉक टेस्ट खुल जाएगा।",
    retakeTitle: "फिर से मॉक देने का नियम",
    retakeBody: "मॉक के बाद जिन कमजोर विषयों में गलती हुई है, उन्हें पहले अभ्यास करना होगा। उसके बाद ही मॉक फिर से दे सकते हो।",
    historyTitle: "इतिहास कैसे दिखेगा",
    historyBody: "प्रगति इतिहास पेज पर सही प्रश्न, गलत उत्तर, सटीकता, विषय-वार सुधार, और पुराने मॉक टेस्ट दिखेंगे।",
  },
  Marathi: {
    progressHistory: "विद्यार्थी प्रगती इतिहास",
    correct: "बरोबर",
    wrong: "चुकीचे",
    attempts: "प्रयत्न",
    accuracy: "अचूकता",
    challengeReady: "आव्हानासाठी तयार",
    projectFlow: "प्रोजेक्ट फ्लो",
    showInstructions: "सूचना दाखवा",
    close: "बंद करा",
    mockUnlockTitle: "मॉक कधी उघडेल",
    mockUnlockBody: "प्रत्येक विषयात किमान 60% अचूकता ठेवून सर्व विषय पूर्ण केल्यावर मॉक टेस्ट उपलब्ध होईल.",
    retakeTitle: "पुन्हा मॉक देण्याचा नियम",
    retakeBody: "मॉकनंतर ज्या कमकुवत विषयांत चुका झाल्या आहेत त्यांचा आधी सराव करावा लागेल. त्यानंतरच मॉक पुन्हा देता येईल.",
    historyTitle: "इतिहास कसा दिसेल",
    historyBody: "प्रगती इतिहास पेजवर बरोबर प्रश्न, चुकीची उत्तरे, अचूकता, विषयानुसार वाढ, आणि जुने मॉक टेस्ट दिसतील.",
  },
};

const projectFlowSteps: Record<string, Array<{ title: string; body: string; accent: string }>> = {
  English: [
    { title: "Choose a Topic", body: "Tap any topic card to begin learning one subject at a time.", accent: "from-[#E91E63] to-[#FF4081]" },
    { title: "Learn the Concept", body: "Read the theory, formula, and solved examples before practice.", accent: "from-[#2563EB] to-[#38BDF8]" },
    { title: "Practice Questions", body: "Solve topic questions and improve step by step.", accent: "from-[#16A34A] to-[#34D399]" },
    { title: "Take Mock Test", body: "Use the timed mock test after practice to simulate the real exam.", accent: "from-[#F97316] to-[#FACC15]" },
    { title: "Track Progress", body: "Check progress history and score cards to see growth and weak topics.", accent: "from-[#8B5CF6] to-[#D946EF]" },
  ],
  Hindi: [
    { title: "विषय चुनें", body: "किसी भी विषय कार्ड पर क्लिक करके पढ़ना शुरू करें।", accent: "from-[#E91E63] to-[#FF4081]" },
    { title: "कॉन्सेप्ट समझें", body: "अभ्यास से पहले सिद्धांत, सूत्र और उदाहरण देखें।", accent: "from-[#2563EB] to-[#38BDF8]" },
    { title: "प्रश्न हल करें", body: "प्रश्न हल करके धीरे-धीरे बेहतर बनें।", accent: "from-[#16A34A] to-[#34D399]" },
    { title: "मॉक टेस्ट दें", body: "अभ्यास के बाद टाइम्ड मॉक टेस्ट देकर असली परीक्षा जैसा अनुभव लें।", accent: "from-[#F97316] to-[#FACC15]" },
    { title: "प्रगति देखें", body: "प्रगति इतिहास और स्कोर कार्ड से अपनी बढ़त देखें।", accent: "from-[#8B5CF6] to-[#D946EF]" },
  ],
  Marathi: [
    { title: "विषय निवडा", body: "कोणत्याही विषयाच्या कार्डवर क्लिक करून शिकायला सुरुवात करा.", accent: "from-[#E91E63] to-[#FF4081]" },
    { title: "संकल्पना समजा", body: "सरावापूर्वी सिद्धांत, सूत्र आणि उदाहरणे पाहा.", accent: "from-[#2563EB] to-[#38BDF8]" },
    { title: "प्रश्न सोडवा", body: "प्रश्न सोडवून हळूहळू सुधारणा करा.", accent: "from-[#16A34A] to-[#34D399]" },
    { title: "मॉक टेस्ट द्या", body: "सरावानंतर टाइम्ड मॉक टेस्ट देऊन खऱ्या परीक्षेसारखा अनुभव घ्या.", accent: "from-[#F97316] to-[#FACC15]" },
    { title: "प्रगती पाहा", body: "प्रगती इतिहास आणि स्कोअर कार्डमधून वाढ पहा.", accent: "from-[#8B5CF6] to-[#D946EF]" },
  ],
};

export default function ToolDashboardClient({ session }: Props) {
  const { language } = useLanguage();
  const text = useMemo(() => getUiText(language), [language]);
  const copy = dashboardCopy[language] ?? dashboardCopy.English;
  const flowSteps = projectFlowSteps[language] ?? projectFlowSteps.English;
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const [progress, setProgress] = useState<ProgressData>({
    totalSolved: 0,
    totalAttempts: 0,
    totalWrong: 0,
    totalPoints: 0,
    topicProgress: {},
  });

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProgress(d))
      .catch(() => {});
  }, []);

  const mockEligibility = progress.mockEligibility;
  const totalTopics = mockEligibility?.totalTopics ?? Object.keys(topicsData).length;
  const passedTopics = mockEligibility?.passedTopics ?? 0;
  const requiredAccuracy = mockEligibility?.requiredAccuracy ?? 60;

  const profileName = useMemo(() => {
    return session.user?.name?.trim() || session.user?.email?.split("@")[0] || "Student";
  }, [session.user]);

  const totalPct =
    TOTAL_QUESTION_COUNT > 0
      ? Math.min(100, Math.round((progress.totalSolved / TOTAL_QUESTION_COUNT) * 100))
      : 0;
  const overallAccuracy =
    progress.totalAttempts > 0
      ? Math.round((progress.totalSolved / progress.totalAttempts) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      <DashboardSidebar
        session={session}
        totalPoints={progress.totalPoints}
      />
      <main className="relative ml-0 lg:ml-[260px] flex-1 overflow-hidden pb-20">

      {instructionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-4 sm:py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100vh-3rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-5 sm:px-7 py-5 text-white">
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-white/80">{copy.projectFlow}</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black">{copy.showInstructions}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInstructionsOpen(false)}
                className="rounded-full bg-white/15 px-4 py-2 text-xs sm:text-sm font-black text-white transition hover:bg-white/25"
              >
                {copy.close}
              </button>
            </div>

            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto grid gap-4 px-5 sm:px-7 py-6 sm:py-8">
              {flowSteps.map((step) => (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-[#FFF9FB] p-4 sm:p-5">
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 rounded-2xl bg-gradient-to-br ${step.accent} shadow-[0_12px_30px_rgba(233,30,99,0.18)]`} />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm leading-6 text-slate-600">{step.body}</p>
                  </div>
                </div>
              ))}

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-[#E91E63]">{copy.mockUnlockTitle}</p>
                  <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-700">{copy.mockUnlockBody}</p>
                  <div className="mt-4 inline-flex rounded-full bg-[#FFF0F5] px-3 py-1 text-[10px] sm:text-xs font-black text-[#E91E63]">
                    {passedTopics}/{totalTopics} topics passed
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-[#2563EB]">{copy.retakeTitle}</p>
                  <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-700">{copy.retakeBody}</p>
                  <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] sm:text-xs font-black text-[#2563EB]">
                    {requiredAccuracy}% required in each topic
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-[#8B5CF6]">{copy.historyTitle}</p>
                  <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-700">{copy.historyBody}</p>
                  <div className="mt-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] sm:text-xs font-black text-[#8B5CF6]">
                    {copy.progressHistory}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-5%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.025)_42%,_transparent_72%)] blur-2xl" />
        <div className="absolute right-[-10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.09)_0%,_rgba(59,130,246,0.025)_45%,_transparent_74%)] blur-3xl" />
        <div className="absolute bottom-[-12%] left-[24%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(255,138,101,0.08)_0%,_rgba(255,138,101,0.02)_48%,_transparent_72%)] blur-3xl" />
        <span className="animate-float absolute left-[11%] top-[14%] text-6xl font-black text-slate-300 opacity-10" style={{ animationDelay: "0s" }}>π</span>
        <span className="animate-float absolute right-[12%] top-[26%] text-5xl font-black text-slate-300 opacity-[0.08]" style={{ animationDelay: "1.2s" }}>√n</span>
        <span className="animate-float absolute left-[54%] top-[62%] text-6xl font-black text-slate-300 opacity-[0.09]" style={{ animationDelay: "2.1s" }}>∑</span>
      </div>

      <div className="relative border-b border-white/40 bg-white/50 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 backdrop-blur-xl">
        👍 {helloLabel[language] ?? helloLabel.English} {profileName}! {bannerMsg[language] ?? bannerMsg.English}
      </div>

      <header className="relative px-4 sm:px-6 py-8 sm:py-14 text-center">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/50 bg-white/55 px-4 sm:px-6 py-8 sm:py-12 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setInstructionsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E91E63]/20 bg-white px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff1f6]"
          >
            📘 {copy.showInstructions}
          </button>
        </div>
        <div className="mb-4 sm:mb-5 inline-block rounded-full border border-[#E91E63]/15 bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-[#E91E63] shadow-sm backdrop-blur-md">
          ✨ {text.remember} ✨
        </div>
        <h1 className="mb-2 sm:mb-3 text-2xl sm:text-4xl md:text-6xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] bg-clip-text text-transparent">
            🎯 {text.pickPower}
          </span>
        </h1>
        <p className="mx-auto mb-8 sm:mb-10 max-w-2xl text-xs sm:text-base md:text-lg text-gray-600">{text.heroBody} 💪</p>

        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-gray-500">🔥 {progress.totalSolved}/{TOTAL_QUESTION_COUNT} {text.solved}</span>
            <span className="text-yellow-600">⭐ {progress.totalPoints} {text.pts}</span>
          </div>
          <div className="relative h-4 sm:h-5 w-full rounded-full bg-white/80 p-1 shadow-inner shadow-slate-200/50">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] shadow-[0_0_24px_rgba(233,30,99,0.30)] transition-all duration-700"
              style={{ width: `${totalPct}%` }}
            >
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)]" />
            </div>
          </div>
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-400">🎯 {tipMsg[language] ?? tipMsg.English}</p>
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">{copy.correct}</p>
            <p className="mt-1 text-xl font-black text-emerald-700">{progress.totalSolved}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">{copy.wrong}</p>
            <p className="mt-1 text-xl font-black text-rose-700">{progress.totalWrong}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{copy.attempts}</p>
            <p className="mt-1 text-xl font-black text-slate-800">{progress.totalAttempts}</p>
          </div>
          <div className="rounded-2xl border border-[#E91E63]/15 bg-[#fff1f6] p-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#E91E63]">{copy.accuracy}</p>
            <p className="mt-1 text-xl font-black text-[#E91E63]">{overallAccuracy}%</p>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl items-center justify-center">
          <Link
            href="/progress-history"
            className="inline-flex items-center gap-2 rounded-full border border-[#E91E63]/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#E91E63] transition-colors hover:bg-[#fff1f6]"
          >
            {copy.progressHistory} →
          </Link>
        </div>
        </div>
      </header>

      <p className="mt-6 sm:mt-8 px-4 sm:px-6 text-center text-xs sm:text-sm font-bold text-gray-400">
        {text.tapTopic} →
      </p>

      <section className="relative mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
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
              className={`group block rounded-[1.75rem] border ${topic.border} bg-white/70 p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-white/70 hover:shadow-[0_20px_45px_rgba(251,207,232,0.85)]`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-12 sm:h-14 w-12 sm:w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${topic.color} text-lg sm:text-2xl shadow-[0_12px_26px_rgba(0,0,0,0.12)] ${topic.glow} ring-8 ring-white/65 transition-transform duration-300 group-hover:scale-110`}>
                  {topic.icon}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-gray-800">{localized.title}</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400">
                    {solved}/{total} {qLabel[language] ?? "questions"} • ⭐ {pts} {text.pts}
                  </p>
                </div>
              </div>

              <div className="mb-2 h-2.5 sm:h-3 w-full rounded-full bg-white/75 p-[2px] sm:p-[3px] shadow-inner shadow-white/60">
                <div
                  className={`relative h-full rounded-full bg-gradient-to-r ${topic.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                >
                  <span className="absolute right-0 top-1/2 h-2 sm:h-2.5 w-2 sm:w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-gray-400">{pct}%</span>
                <span className="text-[10px] sm:text-xs font-black text-[#E91E63] transition-colors group-hover:text-[#c2185b]">
                  {text.letsGo} →
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="relative mx-auto mt-12 sm:mt-16 max-w-xl px-4 sm:px-6 pb-32 text-center">
        <h4 className="mb-2 text-lg sm:text-xl font-black text-gray-800">🏆 {text.thinkReady}</h4>
        <p className="mb-6 text-xs sm:text-sm text-gray-400">{text.mockBody}</p>
        <p className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-bold italic text-[#E91E63]">🔥 {text.keepGoing}</p>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/60 bg-[#F8FAFC]/88 backdrop-blur-xl lg:left-[260px]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 text-center">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] text-[#E91E63]">{copy.challengeReady}</p>
            <p className="text-xs sm:text-sm text-gray-400">{text.mockBody}</p>
          </div>
          <Link
            href="/mock-test"
            className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-5 sm:px-8 py-2 sm:py-3.5 text-xs sm:text-base font-black text-white shadow-[0_20px_40px_rgba(233,30,99,0.24)] transition-all hover:scale-105 whitespace-nowrap"
          >
            🚀 🎫 {text.takeMock} →
          </Link>
        </div>
      </div>
    </main>
    </div>
  );
}
