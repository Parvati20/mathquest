"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getLocalizedQuestion,
  getLocalizedTopicContent,
  getUiText,
} from "@/lib/language";
import { makeQuestionSignature, type MockQuestion } from "@/lib/mockSession";
import { topicsData } from "@/lib/topicsData";

const MOCK_QUESTION_COUNT = 20;
const MOCK_DURATION_SECONDS = 15 * 60;
const MARKS_PER_QUESTION = 4;
const MOCK_HISTORY_STORAGE_KEY = "mathquest-mock-history";

function readMockQuestionHistory() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(MOCK_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  } catch {
    return [];
  }
}

function saveMockQuestionHistory(questions: MockQuestion[]) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readMockQuestionHistory();
  const merged = new Set(existing);

  for (const question of questions) {
    merged.add(makeQuestionSignature(question.question));
  }

  const capped = Array.from(merged).slice(-900);

  try {
    window.localStorage.setItem(MOCK_HISTORY_STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // Ignore localStorage write errors.
  }
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function CircularProgressStat({
  label,
  value,
  valueText,
  color,
  glow,
}: {
  label: string;
  value: number;
  valueText: string;
  color: string;
  glow: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-5 text-center shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
      <div className="mx-auto mb-3 grid h-28 w-28 place-items-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-full border border-white/70 bg-white/80"
          style={{
            background: `conic-gradient(${color} ${value}%, rgba(148,163,184,0.16) 0%)`,
            boxShadow: glow,
          }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-sm font-black text-slate-700">
            {valueText}
          </div>
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function getSessionSourceLabel(source: "llm" | "mixed" | "bank", language: string) {
  if (language === "Hindi") {
    return source === "llm" ? "AI से" : source === "mixed" ? "AI + बैंक" : "प्रश्न बैंक से";
  }

  if (language === "Marathi") {
    return source === "llm" ? "AI कडून" : source === "mixed" ? "AI + प्रश्नसंच" : "प्रश्नसंचातून";
  }

  return source === "llm" ? "From LLM" : source === "mixed" ? "LLM + Bank" : "From Question Bank";
}

export default function MockTestClient() {
  const { language } = useLanguage();
  const [sessionSeed, setSessionSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(MOCK_QUESTION_COUNT).fill(null),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [burstTick, setBurstTick] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION_SECONDS);
  const [finished, setFinished] = useState(false);
  const [resultAnimated, setResultAnimated] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<MockQuestion[]>([]);
  const [isGeneratingSession, setIsGeneratingSession] = useState(true);
  const [sessionSource, setSessionSource] = useState<"llm" | "mixed" | "bank">("bank");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const savedRef = useRef(false);
  const text = getUiText(language);

  const currentQuestion = sessionQuestions[currentIndex];
  const localizedCurrentQuestion = currentQuestion
    ? getLocalizedQuestion(currentQuestion, language)
    : null;

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setIsGeneratingSession(true);
      setGenerationError(null);

      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 7000);
        const response = await fetch("/api/mock-test/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            language,
            variationSeed: sessionSeed,
            blockedQuestionSignatures: readMockQuestionHistory(),
          }),
        });
        window.clearTimeout(timeout);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const failedBody = await response.json().catch(() => null);
          const apiError = typeof failedBody?.error === "string" ? failedBody.error : "Mock test generation failed.";
          throw new Error(apiError);
        }

        const data = await response.json();
        const questions = Array.isArray(data?.questions) ? (data.questions as MockQuestion[]) : [];
        const apiSource = data?.source === "llm" ? "llm" : "llm";

        if (questions.length > 0) {
          setSessionQuestions(questions.slice(0, MOCK_QUESTION_COUNT));
          setSessionSource(apiSource);
          saveMockQuestionHistory(questions);
        } else {
          throw new Error("LLM did not return questions.");
        }
      } catch (error) {
        if (!cancelled) {
          setSessionQuestions([]);
          setSessionSource("llm");
          setGenerationError(
            error instanceof Error && error.message
              ? error.message
              : "Unable to generate unique LLM mock questions right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [language, sessionSeed]);

  useEffect(() => {
    if (finished || isGeneratingSession || sessionQuestions.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, isGeneratingSession, sessionQuestions.length]);

  useEffect(() => {
    if (!finished) {
      setResultAnimated(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setResultAnimated(true);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [finished]);

  const submitCurrent = () => {
    if (selectedIndex === null) {
      return;
    }

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selectedIndex;
    setAnswers(nextAnswers);

    if (selectedIndex === currentQuestion?.answerIndex) {
      setBurstTick((prev) => prev + 1);
    }

    setSubmitted(true);
  };

  const goToNextQuestion = () => {
    if (!submitted) {
      return;
    }

    if (currentIndex === sessionQuestions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
    setSubmitted(false);
  };

  const startNewMock = () => {
    savedRef.current = false;
    setSessionSeed((prev) => prev + 1);
    setSessionQuestions([]);
    setCurrentIndex(0);
    setAnswers(Array(MOCK_QUESTION_COUNT).fill(null));
    setSelectedIndex(null);
    setSubmitted(false);
    setBurstTick(0);
    setTimeLeft(MOCK_DURATION_SECONDS);
    setFinished(false);
    setResultAnimated(false);
    setIsGeneratingSession(true);
    setSessionSource("bank");
  };

  const correctCount = sessionQuestions.reduce((score, question, index) => {
    return answers[index] === question.answerIndex ? score + 1 : score;
  }, 0);

  const answeredCount = answers.filter((item) => item !== null).length;
  const wrongCount = answeredCount - correctCount;
  const accuracy = sessionQuestions.length > 0 ? Math.round((correctCount / sessionQuestions.length) * 100) : 0;
  const score = correctCount * MARKS_PER_QUESTION;
  const maxScore = sessionQuestions.length * MARKS_PER_QUESTION;
  const selectedAnswerCorrect =
    submitted && currentQuestion ? selectedIndex === currentQuestion.answerIndex : false;

  const wrongAttempts = sessionQuestions
    .map((question, index) => ({
      question,
      selectedIndex: answers[index],
    }))
    .filter(
      (item) =>
        item.selectedIndex !== null &&
        item.selectedIndex !== item.question.answerIndex,
    )
    .slice(0, 10);

  const weakTopics = Object.entries(
    wrongAttempts.reduce<Record<string, number>>((acc, item) => {
      acc[item.question.topic] = (acc[item.question.topic] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => ({
      id: topic,
      title: getLocalizedTopicContent(
        topic as keyof typeof topicsData,
        language,
      ).title,
    }));
  const weakTopicIds = weakTopics.map((topic) => topic.id);

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    void fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mock",
        correctCount,
        score,
        wrongCount,
        totalCount: sessionQuestions.length,
        weakTopicIds,
      }),
    });
  }, [finished, correctCount, score, wrongCount, sessionQuestions.length, weakTopicIds]);

  if (isGeneratingSession && sessionQuestions.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans text-gray-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.02)_42%,_transparent_72%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.08)_0%,_rgba(59,130,246,0.02)_45%,_transparent_74%)] blur-3xl" />
        </div>

        <nav className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/70 bg-white/70 px-4 sm:px-6 md:px-8 py-3 sm:py-4 backdrop-blur-md">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] ${sessionSource === "llm" ? "bg-emerald-100 text-emerald-700" : sessionSource === "mixed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {getSessionSourceLabel(sessionSource, language)}
            </span>
            <LanguageSelect className="bg-white text-xs sm:text-sm" />
          </div>
        </nav>

        <section className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 sm:px-6 py-10 text-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 sm:p-10 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-5xl">🧠</p>
            <h1 className="mt-4 text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
              Building a fresh mock test
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              We are generating a new mixed session so the same questions do not keep repeating.
            </p>
            <div className="mx-auto mt-6 h-2 w-48 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65]" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#E91E63]">
              Fresh session by {sessionSource === "llm" ? "LLM" : sessionSource === "mixed" ? "LLM + bank fallback" : "bank fallback"}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!isGeneratingSession && sessionQuestions.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans text-gray-900">
        <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 sm:px-6 py-10 text-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 sm:p-10 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-5xl">⚠️</p>
            <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
              Unable to generate mock right now
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600">
              {generationError ?? "Unique LLM questions are not available at this moment. Please retry."}
            </p>
            <button
              type="button"
              onClick={() => setSessionSeed(Date.now())}
              className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Retry LLM Mock
            </button>
            <div className="mt-4">
              <Link href="/tool" className="text-xs font-bold text-slate-600 underline underline-offset-4">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (finished) {
    const perfect = correctCount === sessionQuestions.length;
    const scorePercent =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans text-gray-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.02)_42%,_transparent_72%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.08)_0%,_rgba(59,130,246,0.02)_45%,_transparent_74%)] blur-3xl" />
        </div>

        <nav className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/70 bg-white/70 px-4 sm:px-6 md:px-8 py-3 sm:py-4 backdrop-blur-md">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`rounded-full px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] ${sessionSource === "llm" ? "bg-emerald-100 text-emerald-700" : sessionSource === "mixed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {getSessionSourceLabel(sessionSource, language)}
            </span>
            <Link
              href="/tool"
              className="text-xs sm:text-sm font-semibold text-[#E91E63] hover:text-[#c2185b]"
            >
              {text.backToTopics}
            </Link>
          </div>
        </nav>

        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="pointer-events-none absolute inset-x-6 top-10 h-44 rounded-[2rem] bg-[radial-gradient(circle,_rgba(233,30,99,0.14)_0%,_rgba(233,30,99,0.03)_55%,_transparent_72%)]" />
          <div className="pointer-events-none absolute inset-x-6 top-0 overflow-hidden rounded-3xl">
            <span className="confetti mega-confetti-1" />
            <span className="confetti mega-confetti-2" />
            <span className="confetti mega-confetti-3" />
            <span className="confetti mega-confetti-4" />
            <span className="confetti mega-confetti-5" />
            <span className="confetti mega-confetti-6" />
          </div>

          <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-6 sm:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="text-center">
              <p className="text-5xl">🏆</p>
              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                {perfect ? text.fullMarks : text.testComplete}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-gray-500">
                {perfect ? text.perfectBody : text.retryBody}
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              <CircularProgressStat
                label={text.score}
                value={resultAnimated ? scorePercent : 0}
                valueText={`${score}/${maxScore}`}
                color="#E91E63"
                glow="0 0 20px rgba(233,30,99,0.22)"
              />
              <CircularProgressStat
                label={text.accuracy}
                value={resultAnimated ? accuracy : 0}
                valueText={`${accuracy}%`}
                color="#10B981"
                glow="0 0 20px rgba(16,185,129,0.22)"
              />
            </div>

            <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-bold text-emerald-700">
                  {text.correct}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-emerald-700">
                  {correctCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-bold text-rose-700">{text.wrong}</p>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-rose-700">
                  {wrongCount}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/80 bg-white/80 p-4 sm:p-5 text-left">
              <p className="text-xs sm:text-sm font-bold text-gray-700">
                {text.weakTopics}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakTopics.length > 0 ? (
                  weakTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center gap-2 rounded-full border border-[#E91E63]/20 bg-[#fff1f6] px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-[#E91E63]"
                    >
                      <span>{topic.title}</span>
                      <Link
                        href={`/${topic.id}`}
                        className="rounded-full border border-[#E91E63]/30 bg-white px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-[#E91E63] hover:bg-[#E91E63] hover:text-white"
                      >
                        Review Now
                      </Link>
                    </div>
                  ))
                ) : (
                  <span className="text-xs sm:text-sm text-emerald-600">
                    {text.noWeakTopic}
                  </span>
                )}
              </div>
            </div>

            {wrongAttempts.length > 0 ? (
              <div className="mx-auto mt-6 max-w-3xl space-y-3 text-left">
                {wrongAttempts.map((item) => (
                  <div
                    key={item.question.id}
                    className="rounded-2xl border border-white/80 bg-white p-3 sm:p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                      <span className="inline-flex rounded-full bg-rose-100 px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-rose-600">
                        Incorrect
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                        {
                          getLocalizedTopicContent(
                            item.question.topic as keyof typeof topicsData,
                            language,
                          ).title
                        }
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      {item?.question &&
                        getLocalizedQuestion(item.question, language)?.question}
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs text-rose-500">
                      {text.correctAnswer}:{" "}
                      {item?.question?.options?.[item?.question?.answerIndex]}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Link
              href="/tool"
              className="rounded-xl border border-[#E91E63]/35 bg-white/35 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#E91E63] backdrop-blur-md transition-colors hover:bg-[#E91E63]/10"
              >
                {text.backToTopics}
              </Link>
              <button
                onClick={startNewMock}
              className="rounded-xl bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-5 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-black text-white shadow-[0_16px_34px_rgba(233,30,99,0.26)] transition-transform hover:scale-105"
              >
                {text.tryAgain}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans text-gray-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.02)_42%,_transparent_72%)] blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.08)_0%,_rgba(59,130,246,0.02)_45%,_transparent_74%)] blur-3xl" />
        <span className="animate-float absolute left-[15%] top-[22%] text-5xl opacity-[0.06]">
          ⏱️
        </span>
        <span
          className="animate-float absolute right-[18%] top-[32%] text-5xl opacity-[0.05]"
          style={{ animationDelay: "1.5s" }}
        >
          ✅
        </span>
        <span
          className="animate-float absolute left-[28%] bottom-[22%] text-5xl opacity-[0.05]"
          style={{ animationDelay: "2.2s" }}
        >
          ⏱️
        </span>
      </div>

      <nav className="relative flex items-center justify-between border-b border-white/70 bg-white/70 px-4 sm:px-6 md:px-8 py-3 sm:py-4 backdrop-blur-md flex-wrap gap-2">
        <BrandLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelect className="bg-white text-xs sm:text-sm" />
          <div className="rounded-full border border-[#E91E63]/15 bg-gradient-to-r from-[#E91E63]/12 to-[#FF8A65]/12 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-black text-[#E91E63]">
            ⏰ {formatTimer(timeLeft)}
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 w-full gap-2">
          <span>
            {text.question} {currentIndex + 1}/{sessionQuestions.length}
          </span>
          <span className="rounded-full border border-[#E91E63]/15 bg-white/80 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-[#E91E63]">
            15:00 {text.timerRunning}
          </span>
        </div>

        <div className="mt-3 h-3 sm:h-4 w-full rounded-full bg-white/80 p-0.5 sm:p-1">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] shadow-[0_0_20px_rgba(233,30,99,0.18)] transition-all"
            style={{
              width: `${Math.round(((currentIndex + 1) / sessionQuestions.length) * 100)}%`,
            }}
          />
        </div>

        <article className="mt-6 rounded-[2rem] border border-white/70 bg-white/72 p-4 sm:p-6 backdrop-blur-md">
          {submitted && selectedAnswerCorrect ? (
            <div key={burstTick} className="pointer-events-none absolute inset-x-0 top-24 z-20 h-40 overflow-visible">
              <span className="firework firework-a" />
              <span className="firework firework-b" />
              <span className="firework firework-c" />
              <span className="firework firework-d" />
              <span className="firework firework-e" />
              <span className="firework firework-f" />
              <span className="firework firework-g" />
              <span className="firework firework-h" />
              <span className="confetti mega-confetti-1" />
              <span className="confetti mega-confetti-2" />
              <span className="confetti mega-confetti-3" />
              <span className="confetti mega-confetti-4" />
              <span className="confetti mega-confetti-5" />
              <span className="confetti mega-confetti-6" />
            </div>
          ) : null}

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-gray-800">
            {localizedCurrentQuestion?.question}
          </h2>

          {submitted ? (
            <div
              className={`mt-4 rounded-2xl border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold ${
                selectedAnswerCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span>
                {selectedAnswerCorrect ? text.correct : text.wrong}
              </span>
              {!selectedAnswerCorrect && currentQuestion ? (
                <span className="ml-2 text-rose-500">
                  {text.correctAnswer}: {localizedCurrentQuestion?.options?.[currentQuestion.answerIndex]}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {localizedCurrentQuestion?.options.map((option, optionIndex) => {
              const letter = String.fromCharCode(65 + optionIndex);
              const picked = selectedIndex === optionIndex;
              const isAnswer = currentQuestion?.answerIndex === optionIndex;
              const isWrongPick = submitted && picked && !isAnswer;
              const isCorrectAnswer = submitted && isAnswer;

              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (!submitted) {
                      setSelectedIndex(optionIndex);
                    }
                  }}
                  className={`flex w-full items-center gap-3 sm:gap-4 rounded-2xl border px-3 sm:px-4 py-3 sm:py-4 text-left transition-all duration-200 text-sm ${
                    isCorrectAnswer
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_12px_24px_rgba(16,185,129,0.14)]"
                      : isWrongPick
                        ? "border-rose-300 bg-rose-50 shadow-[0_12px_24px_rgba(244,63,94,0.12)]"
                        : picked
                          ? "border-[#E91E63]/35 bg-[#fff1f6] shadow-[0_12px_24px_rgba(233,30,99,0.10)]"
                          : "border-white/70 bg-white/75 hover:-translate-y-1 hover:border-[#E91E63]/25 hover:bg-[#fff7fa] hover:shadow-[0_14px_30px_rgba(233,30,99,0.08)]"
                  }`}
                  disabled={submitted}
                >
                  <span
                    className={`inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-black text-white shadow-[0_12px_24px_rgba(15,23,42,0.10)] flex-shrink-0 ${
                      isCorrectAnswer
                        ? "bg-gradient-to-br from-emerald-500 to-lime-500"
                        : isWrongPick
                          ? "bg-gradient-to-br from-rose-500 to-orange-500"
                          : picked
                            ? "bg-gradient-to-br from-[#E91E63] to-[#FF8A65]"
                            : "bg-gradient-to-br from-slate-400 to-slate-500"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-gray-700">{option}</span>
                  {submitted && isCorrectAnswer ? (
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-emerald-700">
                      {text.correct}
                    </span>
                  ) : null}
                  {isWrongPick ? (
                    <span className="ml-auto rounded-full bg-rose-100 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-rose-700">
                      {text.wrong}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </article>

        <div className="mt-5 flex justify-end">
          <button
            onClick={submitted ? goToNextQuestion : submitCurrent}
            disabled={selectedIndex === null && !submitted}
            className="rounded-xl bg-orange-500 px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white transition-all enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {submitted
              ? currentIndex === sessionQuestions.length - 1
                ? text.submitTest
                : text.next
              : text.submit}
          </button>
        </div>
      </section>
    </main>
  );
}
