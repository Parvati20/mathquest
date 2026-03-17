"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getLocalizedTopicContent, getUiText } from "@/lib/language";
import { topicsData } from "@/lib/topicsData";
import type { Session } from "next-auth";

const topicMeta: Record<string, { icon: string; color: string; glow: string; floatA: string; floatB: string }> = {
  "number-patterns":  { icon: "🔢", color: "from-blue-500 to-cyan-400", glow: "shadow-blue-200/70", floatA: "1, 2, 4...", floatB: "∞" },
  "percentage":       { icon: "💯", color: "from-orange-500 to-amber-400", glow: "shadow-orange-200/70", floatA: "%", floatB: "25%" },
  "work-time":        { icon: "⏰", color: "from-emerald-500 to-teal-400", glow: "shadow-emerald-200/70", floatA: "t", floatB: "⏱" },
  "linear-equations": { icon: "📐", color: "from-purple-500 to-fuchsia-400", glow: "shadow-purple-200/70", floatA: "x+y", floatB: "=0" },
  "simple-interest":  { icon: "💰", color: "from-yellow-500 to-orange-300", glow: "shadow-yellow-200/70", floatA: "P×R×T", floatB: "₹" },
  "profit-loss":      { icon: "📉", color: "from-pink-500 to-rose-400", glow: "shadow-pink-200/70", floatA: "SP", floatB: "CP" },
};

type TopicContentClientProps = {
  topic: keyof typeof topicsData;
  session: Session;
};

function emphasizeNumbers(text: string, tone: "pink" | "green") {
  const colorClass = tone === "pink" ? "text-[#E91E63]" : "text-emerald-600";

  return text.split(/(\d+[%₹]?|₹\d+|\d+\/\d+|[a-zA-Z]+\s*=\s*\d+)/g).map((part, index) => {
    if (!part) {
      return null;
    }

    const highlight = /(\d+[%₹]?|₹\d+|\d+\/\d+|[a-zA-Z]+\s*=\s*\d+)/.test(part);
    return (
      <span key={`${part}-${index}`} className={highlight ? `${colorClass} font-bold` : undefined}>
        {part}
      </span>
    );
  });
}

function createQuizFromExample(question: string, answer: string) {
  const answerNumbers = (answer.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const questionNumbers = (question.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

  const correctValue =
    answerNumbers.length > 0
      ? answerNumbers[answerNumbers.length - 1]
      : questionNumbers.length > 0
        ? questionNumbers[questionNumbers.length - 1]
        : 10;

  const seed = Math.max(2, Math.round(correctValue * 0.1));
  const distractors = [
    Math.max(1, correctValue - seed),
    correctValue + seed,
    Math.max(1, correctValue + seed * 2),
  ];

  const raw = [correctValue, ...distractors].filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4);
  while (raw.length < 4) {
    raw.push(raw[raw.length - 1] + 1);
  }

  // Keep deterministic order but avoid always showing correct option first.
  const options = [raw[1], raw[0], raw[2], raw[3]].map((v) => String(v));
  return {
    options,
    correctIndex: 1,
  };
}

function getWorkedSteps(topic: string, question: string, answer: string) {
  const numbers = (question.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

  if (topic === "profit-loss" && numbers.length >= 2) {
    const cp = numbers[0];
    const sp = numbers[1];
    const profit = sp - cp;
    const profitPercent = cp > 0 ? (profit / cp) * 100 : 0;

    return [
      `CP = ${cp}, SP = ${sp}`,
      `Profit = SP - CP = ${sp} - ${cp} = ${profit}`,
      `Profit% = (Profit/CP) x 100 = (${profit}/${cp}) x 100 = ${profitPercent}%`,
    ];
  }

  if (topic === "percentage" && numbers.length >= 2) {
    const percent = numbers[0];
    const whole = numbers[1];
    const result = (percent / 100) * whole;

    return [
      `Formula: (${percent}/100) x ${whole}`,
      `Calculation: ${percent * whole}/100 = ${result}`,
      `So, ${percent}% of ${whole} = ${result}`,
    ];
  }

  if (topic === "simple-interest" && numbers.length >= 3) {
    const p = numbers[0];
    const r = numbers[1];
    const t = numbers[2];
    const si = (p * r * t) / 100;

    return [
      `Given: P=${p}, R=${r}, T=${t}`,
      `SI = (P x R x T) / 100 = (${p} x ${r} x ${t})/100`,
      `SI = ${si}`,
    ];
  }

  if (topic === "linear-equations" && numbers.length >= 3) {
    const a = numbers[0];
    const b = numbers[1];
    const c = numbers[2];
    const rhs = c - b;
    const x = a !== 0 ? rhs / a : 0;

    return [
      `Equation: ${a}x + ${b} = ${c}`,
      `Move constant: ${a}x = ${c} - ${b} = ${rhs}`,
      `Divide by ${a}: x = ${rhs}/${a} = ${x}`,
    ];
  }

  const fallback = answer
    .split(/\s*\.\s*|\s*=>\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return fallback.length > 0 ? fallback : [answer];
}

export default function TopicContentClient({ topic, session }: TopicContentClientProps) {
  const { language } = useLanguage();
  const text = getUiText(language);
  const data = getLocalizedTopicContent(topic, language);
  const videoId = topicsData[topic].videoId;
  const youtubeUrl =
    videoId.startsWith("http://") || videoId.startsWith("https://")
      ? videoId
      : `https://youtube.com/watch?v=${videoId}`;

  const meta = topicMeta[topic] ?? {
    icon: "📚",
    color: "from-gray-500 to-gray-400",
    glow: "shadow-gray-200/70",
    floatA: "π",
    floatB: "∑",
  };

  const [points, setPoints] = useState(0);
  const [openExample, setOpenExample] = useState<number | null>(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizResolved, setQuizResolved] = useState(false);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  const previewImage = useMemo(() => {
    if (videoId.startsWith("http://") || videoId.startsWith("https://")) {
      return "";
    }
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }, [videoId]);

  useEffect(() => {
    void fetch("/api/progress")
      .then((r) => r.json())
      .then((d: { totalPoints?: number }) => {
        if (typeof d?.totalPoints === "number") setPoints(d.totalPoints);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const primaryExample = data.examples?.[0];
    const quiz = createQuizFromExample(primaryExample?.q ?? "", primaryExample?.a ?? "");
    setQuizOptions(quiz.options);
    setQuizCorrectIndex(quiz.correctIndex);
    setQuizSelected(null);
    setQuizResolved(false);
  }, [data.examples]);

  const playTone = (type: "ding" | "buzz") => {
    const AudioContextRef = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextRef) {
      return;
    }

    const ctx = new AudioContextRef();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "ding") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.16);
    }

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    window.setTimeout(() => {
      void ctx.close();
    }, 260);
  };

  const handleQuizPick = (optionIndex: number) => {
    if (quizResolved) {
      return;
    }

    setQuizSelected(optionIndex);

    if (optionIndex === quizCorrectIndex) {
      setQuizResolved(true);
      playTone("ding");
      return;
    }

    setShakeWrong(true);
    playTone("buzz");
    window.setTimeout(() => setShakeWrong(false), 450);
  };

  const revealProgress = useMemo(() => {
    const sections = [
      data.theory ? 1 : 0,
      data.formula ? 1 : 0,
      openExample !== null ? 1 : 0,
      quizResolved ? 1 : 0,
    ];
    const completed = sections.reduce((sum, item) => sum + item, 0);
    return Math.round((completed / sections.length) * 100);
  }, [data.formula, data.theory, openExample, quizResolved]);

  return (
    <div className="flex min-h-screen bg-[#F6F5FB] font-sans text-gray-900">
      <DashboardSidebar
        session={session}
        totalPoints={points}
        appearance="dark"
        currentTopic={{ title: data.title, icon: meta.icon }}
      />

      <main className="relative ml-0 lg:ml-[260px] flex-1 overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-4%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.14)_0%,_rgba(233,30,99,0.03)_46%,_transparent_74%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(100,116,139,0.14)_0%,_rgba(100,116,139,0.03)_42%,_transparent_74%)] blur-3xl" />
          <span className="animate-float absolute left-[9%] top-[16%] text-6xl font-black text-slate-300/40" style={{ animationDelay: "0s" }}>{meta.floatA}</span>
          <span className="animate-float absolute right-[12%] top-[24%] text-5xl font-black text-slate-300/35" style={{ animationDelay: "1.5s" }}>{meta.floatB}</span>
          <span className="animate-float absolute left-[20%] bottom-[20%] text-6xl font-black text-slate-300/30" style={{ animationDelay: "0.9s" }}>∑</span>
          <span className="animate-float absolute right-[20%] bottom-[16%] text-6xl font-black text-slate-300/25" style={{ animationDelay: "2.3s" }}>√n</span>
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-10">
          <Link href="/tool" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/55 px-4 py-2 text-sm font-semibold text-gray-500 shadow-sm backdrop-blur-md transition-colors hover:text-[#E91E63]">
            ← {text.backToTopics}
          </Link>

          <div className="mb-8 rounded-[2rem] border border-white/50 bg-white/45 px-6 py-8 shadow-[0_30px_80px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${meta.color} text-3xl shadow-xl ${meta.glow}`}>
                {meta.icon}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-[#E91E63]">Interactive Cheat Sheet</p>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">{data.title}</h1>
                <p className="mt-1 text-sm text-gray-500">{text.learnConcept} • Quick, visual and interview-focused</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-[1.75rem] border border-white/50 bg-white/60 p-6 shadow-2xl shadow-slate-200/35 backdrop-blur-xl">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#E91E63]">
                  💡 Secret Hack
                </p>
                <h2 className="mb-3 text-xl font-black text-gray-900">{text.theory}</h2>
                <p className="text-[15px] leading-8 text-slate-600">{data.theory}</p>
              </section>

              <section className="rounded-[1.75rem] border border-white/50 bg-white/60 p-6 shadow-2xl shadow-slate-200/35 backdrop-blur-xl">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#E91E63]">
                  🧪 Formula Lab
                </p>
                <h2 className="mb-4 text-xl font-black text-gray-900">{text.formula}</h2>
                <div className="space-y-3">
                  {data.formula.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#E91E63]/25 bg-[#0F172A] px-4 py-3 font-mono text-sm text-white shadow-[0_0_0_1px_rgba(233,30,99,0.10),0_0_18px_rgba(233,30,99,0.20)]"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <span>Learning Progress</span>
                <span>{revealProgress}%</span>
              </div>
              <div className="relative h-4 w-full rounded-full bg-white/80 p-1 shadow-inner shadow-slate-200/50">
                <div className="relative h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] shadow-[0_0_16px_rgba(233,30,99,0.35)] transition-all duration-500" style={{ width: `${revealProgress}%` }}>
                  <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.95)]" />
                </div>
              </div>
            </div>
          </div>

          <div className={`mb-8 rounded-[2rem] border border-white/50 bg-white/45 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.14)] backdrop-blur-2xl ${shakeWrong ? "animate-shake" : ""}`}>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#E91E63]">Math Magician Mode</p>
            <h2 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">
              <span className="bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] bg-clip-text text-transparent">Question #1</span>
            </h2>
            <p className="mb-5 text-lg font-bold text-slate-800">
              {data.examples?.[0]?.q ?? "Solve this challenge quickly!"}
            </p>

            <div className="space-y-3">
              {quizOptions.map((option, optionIndex) => {
                const isSelected = quizSelected === optionIndex;
                const isCorrect = quizResolved && optionIndex === quizCorrectIndex;
                const isWrong = quizSelected === optionIndex && !quizResolved;

                return (
                  <button
                    key={`${option}-${optionIndex}`}
                    type="button"
                    onClick={() => handleQuizPick(optionIndex)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      isCorrect
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isWrong
                          ? "border-red-500 bg-red-500 text-white"
                          : isSelected
                            ? "border-[#E91E63] bg-[#fff1f6] shadow-[0_0_15px_rgba(233,30,99,0.5)]"
                            : "border-white/70 bg-white/80 hover:-translate-y-0.5 hover:border-[#E91E63]/30"
                    }`}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63] to-[#FF8A65] text-sm font-black text-white shadow-[0_10px_20px_rgba(233,30,99,0.22)]">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="font-semibold">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8 rounded-[2rem] border border-white/50 bg-white/45 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-[#E91E63]">Step Reveal</p>
                <h2 className="text-2xl font-black text-gray-900">{text.solvedExamples}</h2>
              </div>
              <span className="rounded-full border border-[#E91E63]/20 bg-[#E91E63]/10 px-3 py-1 text-xs font-bold text-[#E91E63]">Tap to reveal</span>
            </div>

            <div className="space-y-4">
              {data.examples?.slice(0, 1).map((example, i) => {
                const isOpen = openExample === i;

                return (
                  <div key={i} className="overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/55 shadow-xl shadow-slate-200/30 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => setOpenExample((current) => (current === i ? null : i))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/60"
                    >
                      <div>
                        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Example {i + 1}</p>
                        <p className="text-sm font-bold leading-7 text-slate-800">Q: {emphasizeNumbers(example.q, "pink")}</p>
                      </div>
                      <span className={`rounded-full border border-[#E91E63]/20 bg-[#E91E63]/10 px-3 py-1 text-xs font-bold text-[#E91E63] transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-white/60 bg-gradient-to-r from-white/45 to-[#fff1f6]/70 px-5 py-5">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#E91E63]">Step by Step</p>
                        <ol className="space-y-1 text-sm leading-7 text-slate-700">
                          {getWorkedSteps(topic, example.q, example.a).map((step, stepIndex) => (
                            <li key={`${i}-step-${stepIndex}`}>
                              <span className="font-bold text-slate-900">Step {stepIndex + 1}:</span>{" "}
                              {emphasizeNumbers(step, "green")}
                            </li>
                          ))}
                        </ol>
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-500">Final Answer</p>
                        <p className="text-sm font-medium leading-7 text-slate-700">A: {emphasizeNumbers(example.a, "green")}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-8 block overflow-hidden rounded-[2rem] border border-white/50 bg-white/45 shadow-[0_30px_80px_rgba(148,163,184,0.14)] backdrop-blur-2xl transition-transform duration-300 hover:scale-[1.01]"
          >
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#E91E63]">
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt={data.title} className="h-full w-full object-cover opacity-65 transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/18 text-3xl text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 group-hover:scale-110">
                  ▶
                </div>
              </div>
              <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
                Video Preview
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-white/70">YouTube Lesson</p>
                <h3 className="text-2xl font-black">{text.watchVideo}</h3>
                <p className="mt-1 text-sm text-white/80">Watch the concept in a more visual format.</p>
              </div>
            </div>
          </a>

          <Link
            href={`/${topic}/practice`}
            className="block w-full rounded-[1.75rem] bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] py-4 text-center text-lg font-black text-white shadow-[0_18px_40px_rgba(233,30,99,0.28)] transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {text.letsGo} →
          </Link>
        </div>
      </main>
    </div>
  );
}
