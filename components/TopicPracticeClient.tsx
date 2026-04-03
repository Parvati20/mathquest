"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedDifficultyLabel, getLocalizedQuestion, getLocalizedTopicContent, getUiText } from "@/lib/language";
import { seededShuffle } from "@/lib/mockSession";
import { topicsData } from "@/lib/topicsData";
import type { Difficulty, TopicQuestion } from "@/lib/questionsData";

type TopicPracticeClientProps = {
  topic: string;
  questions: TopicQuestion[];
};

const SESSION_SIZE = 25;
const LLM_SESSION_SIZE = 20;
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

function getNextDifficulty(current: Difficulty): Difficulty | null {
  const currentIndex = difficulties.indexOf(current);

  if (currentIndex === -1 || currentIndex >= difficulties.length - 1) {
    return null;
  }

  return difficulties[currentIndex + 1] ?? null;
}

function getMoveToNextLabel(nextDifficulty: Difficulty, language: string) {
  if (language === "Hindi") {
    return nextDifficulty === "medium" ? "मीडियम पर जाएं" : "हार्ड पर जाएं";
  }

  if (language === "Marathi") {
    return nextDifficulty === "medium" ? "मध्यमकडे जा" : "कठीणकडे जा";
  }

  return nextDifficulty === "medium" ? "Move to Medium" : "Move to Hard";
}

function normalizeQuestionSignature(question: string) {
  return question.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
}

function getHistoryStorageKey(topic: string, difficulty: Difficulty) {
  return `mathquest-practice-history:${topic}:${difficulty}`;
}

function readQuestionHistory(topic: string, difficulty: Difficulty) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(getHistoryStorageKey(topic, difficulty));
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

function saveQuestionHistory(topic: string, difficulty: Difficulty, questions: TopicQuestion[]) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readQuestionHistory(topic, difficulty);
  const merged = new Set(existing);

  for (const question of questions) {
    merged.add(normalizeQuestionSignature(question.question));
  }

  const capped = Array.from(merged).slice(-300);

  try {
    window.localStorage.setItem(getHistoryStorageKey(topic, difficulty), JSON.stringify(capped));
  } catch {
    // Ignore storage failures.
  }
}

function pickSession<T>(items: T[], count: number, seed: number) {
  if (items.length === 0) {
    return [];
  }

  return seededShuffle(items, seed).slice(0, Math.min(count, items.length));
}

export default function TopicPracticeClient({ topic, questions }: TopicPracticeClientProps) {
  const { language } = useLanguage();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [sessionSeed, setSessionSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [burstTick, setBurstTick] = useState(0);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedSession, setGeneratedSession] = useState<TopicQuestion[] | null>(null);
  const [cachedSessions, setCachedSessions] = useState<Partial<Record<Difficulty, TopicQuestion[]>>>({});
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);
  const [sessionSource, setSessionSource] = useState<"llm" | "bank">("bank");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [mouseX, setMouseX] = useState(0.5);
  const [mouseY, setMouseY] = useState(0.5);
  const savedRef = useRef(false);
  const text = getUiText(language);

  const pool = useMemo(
    () => questions.filter((question) => question.difficulty === difficulty),
    [difficulty, questions],
  );

  const fallbackSession = useMemo(() => pickSession(pool, SESSION_SIZE, sessionSeed), [pool, sessionSeed]);
  const sessionQuestions = generatedSession && generatedSession.length > 0 ? generatedSession : fallbackSession;
  const currentQuestion = sessionQuestions[index];
  const localizedTopic = getLocalizedTopicContent(topic as keyof typeof topicsData, language);
  const localizedCurrentQuestion = currentQuestion ? getLocalizedQuestion(currentQuestion, language) : null;

  const storageSeedKey = useMemo(() => `mathquest-practice-seed:${topic}:${difficulty}`, [topic, difficulty]);

  const requestGeneratedQuestions = useCallback(
    async (
      targetDifficulty: Difficulty,
      variationSeed: number,
      signal: AbortSignal,
    ): Promise<TopicQuestion[]> => {
      const response = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          topic,
          difficulty: targetDifficulty,
          count: LLM_SESSION_SIZE,
          language,
          variationSeed,
          blockedQuestionSignatures: readQuestionHistory(topic, targetDifficulty),
        }),
      });

      if (!response.ok) {
        throw new Error("Question generation request failed.");
      }

      const data = await response.json();
      return Array.isArray(data?.questions) ? (data.questions as TopicQuestion[]) : [];
    },
    [language, topic],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawSeed = window.localStorage.getItem(storageSeedKey);
      const parsedSeed = rawSeed ? Number.parseInt(rawSeed, 10) : 0;
      const safeSeed = Number.isFinite(parsedSeed) ? parsedSeed : 0;
      const nextSeed = safeSeed + 1;

      window.localStorage.setItem(storageSeedKey, String(nextSeed));
      setSessionSeed(nextSeed);
    } catch {
      // If storage access fails (privacy mode), keep current in-memory seed.
    }
  }, [storageSeedKey]);

  useEffect(() => {
    let cancelled = false;

    const fetchGeneratedSession = async () => {
      setIsGeneratingSession(true);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        const generated = await requestGeneratedQuestions(difficulty, sessionSeed, controller.signal);
        clearTimeout(timeout);

        if (cancelled) {
          return;
        }

        if (generated.length > 0) {
          setGeneratedSession(generated);
          setCachedSessions((prev) => ({ ...prev, [difficulty]: generated }));
          saveQuestionHistory(topic, difficulty, generated);
          setSessionSource("llm");
        } else {
          setSessionSource("bank");
        }
      } catch {
        if (!cancelled) {
          setSessionSource("bank");
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingSession(false);
        }
      }
    };

    void fetchGeneratedSession();

    return () => {
      cancelled = true;
    };
  }, [difficulty, requestGeneratedQuestions, sessionSeed, topic]);

  useEffect(() => {
    let cancelled = false;

    const prefetch = async () => {
      const targets = difficulties.filter((level) => !cachedSessions[level]?.length);

      await Promise.all(
        targets.map(async (level) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4500);
            const generated = await requestGeneratedQuestions(level, sessionSeed, controller.signal);
            clearTimeout(timeout);

            if (cancelled || generated.length === 0) {
              return;
            }

            setCachedSessions((prev) => ({ ...prev, [level]: generated }));
            saveQuestionHistory(topic, level, generated);
          } catch {
            // Non-blocking prefetch: ignore failures and keep bank fallback.
          }
        }),
      );
    };

    void prefetch();

    return () => {
      cancelled = true;
    };
  }, [cachedSessions, requestGeneratedQuestions, sessionSeed, topic]);

  useEffect(() => {
    if (!finished) return;
    savedRef.current = true;
  }, [finished]);

  const startNewSession = () => {
    savedRef.current = false;

    const nextSeed = sessionSeed + 1;
    setSessionSeed(nextSeed);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageSeedKey, String(nextSeed));
    }

    setDifficulty("easy");
    setIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setCorrectCount(0);
    setWrongCount(0);
    setFinished(false);
    setBurstTick(0);
    setAiExplanation("");
    setAiError("");
    setAiLoading(false);
    setGeneratedSession(cachedSessions.easy ?? null);
    setIsGeneratingSession(false);
    setSessionSource("bank");
    setCurrentStreak(0);
  };

  const requestAiExplanation = async (
    questionText: string,
    options: string[],
    correctAnswer: string,
    baseExplanation: string,
  ) => {
    setAiLoading(true);
    setAiError("");
    setAiExplanation("");

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: localizedTopic.title,
          question: questionText,
          options,
          correctAnswer,
          baseExplanation,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch AI explanation.");
      }

      setAiExplanation(data?.explanation || "No explanation returned by AI.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch AI explanation.";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDifficulty = (nextDifficulty: Difficulty) => {
    startNewSession();
    setDifficulty(nextDifficulty);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || !currentQuestion) {
      return;
    }

    const isCorrect = selectedIndex === currentQuestion.answerIndex;

    void fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type: "practice",
        topicId: topic,
        correctCount: isCorrect ? 1 : 0,
        totalCount: 1,
      }),
    });

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setBurstTick((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
      setAiExplanation("");
      setAiError("");
      setAiLoading(false);
    } else {
      setWrongCount((prev) => prev + 1);
      setCurrentStreak(0);
      const fallbackOptions = currentQuestion.options;
      const localizedOptions = localizedCurrentQuestion?.options ?? fallbackOptions;
      const correctAnswer = localizedOptions[currentQuestion.answerIndex] ?? String(fallbackOptions[currentQuestion.answerIndex] ?? "");
      const baseExplanation = localizedCurrentQuestion?.explanation ?? currentQuestion.explanation ?? "";

      void requestAiExplanation(
        localizedCurrentQuestion?.question ?? currentQuestion.question,
        localizedOptions,
        correctAnswer,
        baseExplanation,
      );
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    const isLast = index >= sessionQuestions.length - 1;

    if (isLast) {
      const nextDifficulty = getNextDifficulty(difficulty);

      if (nextDifficulty) {
        setDifficulty(nextDifficulty);
        setGeneratedSession(cachedSessions[nextDifficulty] ?? null);
        setIndex(0);
        setSelectedIndex(null);
        setSubmitted(false);
        setAiExplanation("");
        setAiError("");
        setAiLoading(false);
        setSessionSource(cachedSessions[nextDifficulty]?.length ? "llm" : "bank");
        return;
      }

      setFinished(true);
      return;
    }

    setIndex((prev) => prev + 1);
    setSelectedIndex(null);
    setSubmitted(false);
    setAiExplanation("");
    setAiError("");
    setAiLoading(false);
  };

  const total = sessionQuestions.length;
  const questionNumber = total > 0 ? index + 1 : 0;
  const isLastQuestion = index === total - 1;
  const upcomingDifficulty = getNextDifficulty(difficulty);
  const progressPercent = total > 0 ? Math.round((questionNumber / total) * 100) : 0;
  const marks = correctCount * 4;
  const maxMarks = total * 4;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const attemptedCount = correctCount + wrongCount;
  const liveAccuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 100;
  const xpGained = correctCount * 30 + currentStreak * 5;

  if (total === 0) {
    return (
      <main className="min-h-screen bg-[#FFFBF5] font-sans">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-black text-gray-800">{text.noQuestions}</h1>
          <p className="mt-2 text-sm text-gray-500">{text.addQuestions}</p>
          <Link href={`/${topic}`} className="mt-4 inline-block text-sm font-semibold text-orange-500 hover:text-orange-600">
            {text.learnConcept}
          </Link>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-[#FFFBF5] font-sans">
        <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-3 backdrop-blur-md">
          <BrandLogo />
          <Link href={`/${topic}`} className="text-sm font-semibold text-orange-500 hover:text-orange-600">
            {text.learnConcept}
          </Link>
        </nav>

        <section className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-800">{text.practiceResult}</h1>
              <p className="mt-2 text-gray-500">{text.topic}: {localizedTopic.title} ({getLocalizedDifficultyLabel(difficulty, language)})</p>
            </div>
            <LanguageSelect className="bg-white" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">{text.correct}</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{correctCount}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm text-red-700">{text.wrong}</p>
              <p className="mt-1 text-3xl font-black text-red-700">{wrongCount}</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <p className="text-sm text-orange-700">{text.marks}</p>
              <p className="mt-1 text-3xl font-black text-orange-700">{marks}/{maxMarks}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
            <p className="font-semibold text-gray-700">{text.accuracy}: {accuracy}%</p>
            <p className="mt-2 text-sm text-gray-500">
              {accuracy >= 80 ? text.greatWork : text.goodEffort}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => startNewSession()}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600"
            >
              {text.morePractice}
            </button>
            <Link
              href={`/${topic}`}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-bold text-gray-700 transition-colors hover:border-orange-200 hover:text-orange-500"
            >
              {text.learnConcept}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const isCorrect = submitted && selectedIndex === currentQuestion.answerIndex;

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#FDF2F8] font-sans text-gray-800"
      onMouseMove={(event) => {
        const { clientX, clientY, currentTarget } = event;
        const rect = currentTarget.getBoundingClientRect();
        setMouseX((clientX - rect.left) / rect.width);
        setMouseY((clientY - rect.top) / rect.height);
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(233,30,99,0.10),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(249,115,22,0.08),transparent_30%),linear-gradient(180deg,#FDF2F8_0%,#FFF1F7_100%)]" />
        <div
          className="animate-float absolute left-[10%] top-[18%] h-20 w-20 rounded-[1.75rem] border border-pink-200/60 bg-white/50 backdrop-blur-sm"
          style={{ transform: `translate(${(mouseX - 0.5) * -16}px, ${(mouseY - 0.5) * -16}px)` }}
        />
        <div
          className="animate-float absolute right-[14%] top-[28%] h-12 w-12 rotate-45 rounded-2xl border border-[#E91E63]/20 bg-[#E91E63]/10"
          style={{ animationDelay: "1.4s", transform: `translate(${(mouseX - 0.5) * 18}px, ${(mouseY - 0.5) * 18}px)` }}
        />
        <div
          className="animate-float absolute bottom-[18%] left-[18%] h-16 w-16 rounded-full border border-pink-200/50 bg-pink-100/50"
          style={{ animationDelay: "2.3s", transform: `translate(${(mouseX - 0.5) * -12}px, ${(mouseY - 0.5) * 12}px)` }}
        />
      </div>

      <nav className="relative flex items-center justify-between border-b border-pink-100 bg-white/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl">
        <BrandLogo />
        <Link href={`/${topic}`} className="text-sm font-semibold text-[#E91E63] hover:text-pink-700">
          {text.learnConcept}
        </Link>
      </nav>

      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 pb-28">
        <Link href={`/${topic}`} className="text-xs sm:text-sm text-gray-500 hover:text-[#E91E63]">
          &larr; {localizedTopic.title}
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          {difficulties.map((item) => (
            <button
              key={item}
              onClick={() => handleDifficulty(item)}
              className={`rounded-full border px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium capitalize transition-all ${
                difficulty === item
                  ? "border-[#E91E63] bg-[#E91E63]/12 text-[#E91E63] shadow-[0_0_16px_rgba(233,30,99,0.16)]"
                  : "border-pink-100 bg-white/85 text-gray-500 hover:border-[#E91E63]/35 hover:text-[#E91E63]"
              }`}
            >
              {getLocalizedDifficultyLabel(item, language)}
            </button>
          ))}
          <LanguageSelect className="border-pink-100 bg-white py-1 text-gray-700 text-xs sm:text-sm [&>option]:text-gray-900" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-9">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <span className="inline-flex items-center rounded-full border border-[#E91E63]/40 bg-[#E91E63]/10 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#E91E63]">
                {text.question} {questionNumber} {text.of} {total}
              </span>
              <span className="capitalize text-gray-500 text-xs">{getLocalizedDifficultyLabel(difficulty, language)}</span>
            </div>

            <div className="relative h-5 w-full rounded-full border border-pink-100 bg-white p-1 shadow-inner shadow-pink-100/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] shadow-[0_0_24px_rgba(233,30,99,0.35)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{text.correct}: {correctCount}</span>
              <span>{text.wrong}: {wrongCount}</span>
            </div>

            <p className="mt-3 text-xs font-medium">
          {isGeneratingSession ? (
            <span className="text-sky-300">⏳ {text.generatingQuestions}</span>
          ) : sessionSource === "llm" ? (
            <span className="text-emerald-300">🤖 {text.aiRoundActive}</span>
          ) : (
            <span className="text-amber-300">📚 {text.fallbackBank}</span>
          )}
            </p>

            <article className="relative mt-6 overflow-hidden rounded-[2rem] border border-pink-100 bg-white/90 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
          {burstTick > 0 && submitted && isCorrect ? (
            <div key={burstTick} className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="confetti confetti-a" />
              <span className="confetti confetti-b" />
              <span className="confetti confetti-c" />
              <span className="confetti confetti-d" />
            </div>
          ) : null}

              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent" />

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-gray-800">{localizedCurrentQuestion?.question}</h2>

              <div className="mt-6 space-y-3">
                {localizedCurrentQuestion?.options.map((option, optionIndex) => {
              const optionLetter = String.fromCharCode(65 + optionIndex);
              const isPicked = selectedIndex === optionIndex;
              const showCorrect = submitted && optionIndex === currentQuestion.answerIndex;
              const showWrong = submitted && isPicked && !isCorrect;

              return (
                <button
                  key={optionLetter}
                  onClick={() => {
                    if (!submitted) {
                      setSelectedIndex(optionIndex);
                    }
                  }}
                  className={`flex w-full items-center gap-3 sm:gap-4 rounded-2xl border px-3 sm:px-4 py-3 sm:py-4 text-left transition-all duration-200 text-sm sm:text-base ${
                    showCorrect
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_6px_20px_rgba(16,185,129,0.14)]"
                      : showWrong
                        ? "border-red-300 bg-red-50 shadow-[0_6px_20px_rgba(239,68,68,0.12)]"
                        : isPicked
                          ? "border-[#E91E63]/70 bg-[#E91E63]/10 shadow-[0_0_20px_rgba(233,30,99,0.16)]"
                          : "border-pink-100 bg-white hover:scale-[1.02] hover:border-[#E91E63]/30 hover:bg-pink-50"
                  }`}
                >
                  <span className={`inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs sm:text-sm font-black text-white shadow-lg flex-shrink-0 ${
                    showCorrect
                      ? "from-emerald-400 to-emerald-600"
                      : showWrong
                        ? "from-red-400 to-rose-600"
                        : isPicked
                          ? "from-[#E91E63] to-[#FF4081]"
                          : "from-slate-500 to-slate-700"
                  }`}>
                    {optionLetter}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </button>
              );
            })}
              </div>
            </article>

            {!isCorrect && submitted ? (
              <div className="relative z-10 mt-4 w-full overflow-hidden rounded-[1.5rem] border border-sky-200/60 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6 shadow-[0_8px_32px_rgba(14,165,233,0.12)] backdrop-blur-md">
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_50%,#0EA5E9/10,transparent_50%)]" />
                
                <div className="relative">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-sky-600 mb-1">🤖 {text.aiMentor}</p>
                  <p className="text-xs text-sky-500/70">({language})</p>
                  
                  {aiLoading ? (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="inline-block h-4 w-4 rounded-full border-2 border-sky-300 border-t-sky-600 animate-spin" />
                      <p className="text-xs sm:text-sm text-sky-600 font-medium">{text.generating}</p>
                    </div>
                  ) : aiError ? (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50/70 p-3">
                      <p className="text-xs sm:text-sm text-red-600 font-medium">⚠️ {aiError}</p>
                    </div>
                  ) : aiExplanation ? (
                    <div className="mt-4 rounded-2xl border border-sky-200/60 bg-white/75 p-4 sm:p-5 shadow-[0_8px_20px_rgba(14,165,233,0.10)]">
                      <p className="mb-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                        Detailed Explanation
                      </p>
                      <p className="text-base sm:text-lg leading-8 text-slate-700 whitespace-pre-line">
                        {aiExplanation
                          .replace(/Step\s*\d+\s*:/gi, "")
                          .replace(/\s*=>\s*/g, " = ")
                          .replace(/\n{2,}/g, "\n")
                          .trim()}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl">
              <p className={`text-xs sm:text-sm font-semibold ${submitted ? (isCorrect ? "text-emerald-600" : "text-red-500") : "text-gray-600"}`}>
              {submitted
                ? `${isCorrect ? text.correctFeedback : text.incorrect} ${localizedCurrentQuestion?.explanation ?? ""}`
                : text.chooseOption}
              </p>

              <button
                onClick={submitted ? handleNext : handleSubmit}
                disabled={!submitted && selectedIndex === null}
                className={`rounded-2xl px-6 sm:px-8 py-3 font-black text-white transition-all disabled:cursor-not-allowed disabled:bg-pink-100 disabled:text-pink-300 text-sm sm:text-base whitespace-nowrap ${
                  selectedIndex !== null && !submitted
                    ? "animate-submit-pulse bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] shadow-[0_16px_34px_rgba(233,30,99,0.30)] hover:scale-[1.02]"
                    : "bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#F97316] shadow-[0_16px_34px_rgba(233,30,99,0.24)]"
                }`}
              >
                {submitted
                  ? (isLastQuestion
                    ? (upcomingDifficulty ? getMoveToNextLabel(upcomingDifficulty, language) : text.showResult)
                    : text.next)
                  : text.submit}
              </button>
            </div>
          </div>

          <aside className="mt-6 lg:mt-0 lg:pt-10 lg:col-span-3">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-pink-100 bg-white/90 p-3 sm:p-4 shadow-md">
                <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Accuracy</p>
                <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-gray-800">🎯 {liveAccuracy}%</p>
              </div>
              <div className="rounded-[1.5rem] border border-pink-100 bg-white/90 p-3 sm:p-4 shadow-md">
                <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">XP</p>
                <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-gray-800">✨ {xpGained}</p>
              </div>
            </div>
          </aside>
        </div>

      </section>
    </main>
  );
}
