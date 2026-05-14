

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedDifficultyLabel, getLocalizedTopicContent, getUiText } from "@/lib/language";
import { topicsData } from "@/lib/topicsData";
import type { Difficulty, TopicQuestion } from "@/lib/questionsData";

type TopicPracticeClientProps = {
  topic: string;
};

const LLM_SESSION_SIZE = 10;
const LLM_REQUEST_TIMEOUT_MS = 130000;
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const practiceGenerationCache = new Map<string, TopicQuestion[]>();
const practiceGenerationInFlight = new Map<string, Promise<TopicQuestion[]>>();

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
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCleanQuestionStem(question: string) {
  const normalized = question.replace(/\s+/g, " ").trim();
  const optionPattern = /(?:^|\s)(?:A|B|C|D)[\)\.:]\s*/gi;
  const matches = Array.from(normalized.matchAll(optionPattern));

  if (matches.length > 0) {
    const firstMarker = matches[0];
    if (firstMarker.index !== undefined && firstMarker.index > 0) {
      return normalized.slice(0, firstMarker.index).trim();
    }
  }

  return normalized
    .replace(/\s*[A-D][\)\.:]\s*.*$/i, "")
    .replace(/\s*\d+[\)\.:]\s*.*$/i, "")
    .trim();
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

export default function TopicPracticeClient({ topic }: TopicPracticeClientProps) {
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
  const [cachedSessions, setCachedSessions] = useState<Record<string, TopicQuestion[]>>({});
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [mouseX, setMouseX] = useState(0.5);
  const [mouseY, setMouseY] = useState(0.5);
  const savedRef = useRef(false);
  const text = getUiText(language);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const [isSeedReady, setIsSeedReady] = useState(false);

  const sessionQuestions = generatedSession ?? [];
  const currentQuestion = sessionQuestions[index];
  const localizedTopic = getLocalizedTopicContent(topic as keyof typeof topicsData, language);
  const data = currentQuestion;
  const displayQuestion = getCleanQuestionStem(data?.question ?? currentQuestion?.question ?? "");

  const storageSeedKey = useMemo(() => `mathquest-practice-seed:${topic}:${difficulty}`, [topic, difficulty]);
  const difficultyLanguageKey = `${difficulty}:${language}`;

  const requestGeneratedQuestions = useCallback(
    async (
      targetDifficulty: Difficulty,
      variationSeed: number,
      signal: AbortSignal,
    ): Promise<TopicQuestion[]> => {
      try {
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

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errorMessage = typeof data?.error === "string" ? data.error : "Question generation request failed.";
          const detailMessage = typeof data?.details === "string" ? data.details : "No server details available.";
          throw new Error(`${errorMessage} (${response.status}) - ${detailMessage}`);
        }

        return Array.isArray(data?.questions) ? (data.questions as TopicQuestion[]) : [];
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error(`Question generation timed out after ${Math.round(LLM_REQUEST_TIMEOUT_MS / 1000)} seconds.`);
        }

        throw error instanceof Error ? error : new Error("Unknown question generation error.");
      }
    },
    [language, topic],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const initFlagKey = `mathquest-practice-init:${topic}`;
      const alreadyInitialized = window.sessionStorage.getItem(initFlagKey) === "1";
      if (alreadyInitialized) {
        const rawSeed = window.localStorage.getItem(storageSeedKey);
        const parsedSeed = rawSeed ? Number.parseInt(rawSeed, 10) : 0;
        setSessionSeed(Number.isFinite(parsedSeed) ? parsedSeed : 0);
        setIsSeedReady(true);
        return;
      }

      const rawSeed = window.localStorage.getItem(storageSeedKey);
      const parsedSeed = rawSeed ? Number.parseInt(rawSeed, 10) : 0;
      const safeSeed = Number.isFinite(parsedSeed) ? parsedSeed : 0;
      const nextSeed = safeSeed + 1;

      window.localStorage.setItem(storageSeedKey, String(nextSeed));
      window.sessionStorage.setItem(initFlagKey, "1");
      setSessionSeed(nextSeed);
      setIsSeedReady(true);
    } catch {
      // If storage access fails (privacy mode), keep current in-memory seed.
      setIsSeedReady(true);
    }
  }, [storageSeedKey, topic]);

  const fetchGeneratedSession = useCallback(async (seedOverride?: number) => {
    if (!isSeedReady && seedOverride === undefined) {
      return [];
    }

    const seed = seedOverride ?? sessionSeed;
    const requestKey = `${topic}:${difficulty}:${language}:${seed}`;

    console.log(`🔍 fetchGeneratedSession: key=${requestKey}, language=${language}`);

    const cachedSession = practiceGenerationCache.get(requestKey);
    if (cachedSession) {
      console.log(`✅ Found in practiceGenerationCache`);
      if (mountedRef.current) {
        setGeneratedSession(cachedSession);
        setGenerationError(null);
        setIsGeneratingSession(false);
      }

      return cachedSession;
    }

    const inFlightSession = practiceGenerationInFlight.get(requestKey);
    if (inFlightSession) {
      console.log(`⏳ Request in flight for this key`);
      return inFlightSession;
    }

    if (seedOverride === undefined && cachedSessions[difficultyLanguageKey]?.length) {
      console.log(`✅ Found in cachedSessions with key=${difficultyLanguageKey}`);
      if (mountedRef.current) {
        setGeneratedSession(cachedSessions[difficultyLanguageKey] ?? null);
        setGenerationError(null);
        setIsGeneratingSession(false);
      }

      return cachedSessions[difficultyLanguageKey] ?? [];
    }

    console.log(`📥 Fetching fresh questions from API...`);
    setIsGeneratingSession(true);
    setGenerationError(null);

    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);
        const generated = await requestGeneratedQuestions(difficulty, seed, controller.signal);
        clearTimeout(timeout);

        console.log(`📦 Got ${generated.length} questions from API`);

        if (!mountedRef.current) {
          return generated;
        }

        if (generated.length > 0) {
          console.log(`💾 Caching under key=${requestKey}`);
          practiceGenerationCache.set(requestKey, generated);
          setGeneratedSession(generated);
          setCachedSessions((prev) => ({ ...prev, [difficultyLanguageKey]: generated }));
          saveQuestionHistory(topic, difficulty, generated);
          return generated;
        }

        setGenerationError("The question set is incomplete. Please retry.");
        return [];
      } catch (error) {
        if (mountedRef.current) {
          setGenerationError(error instanceof Error ? error.message : "Question generation failed. Please retry.");
        }

        return [];
      } finally {
        if (mountedRef.current) {
          setIsGeneratingSession(false);
        }

        practiceGenerationInFlight.delete(requestKey);
      }
    })();

    practiceGenerationInFlight.set(requestKey, requestPromise);
    return requestPromise;
  }, [cachedSessions, difficulty, difficultyLanguageKey, isSeedReady, language, requestGeneratedQuestions, sessionSeed, topic]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSeedReady) {
      return () => {
        mountedRef.current = false;
      };
    }

    void fetchGeneratedSession();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchGeneratedSession, isSeedReady]);

  useEffect(() => {
    if (!finished) return;
    savedRef.current = true;
  }, [finished]);

  const startNewSession = (bumpSeed = true) => {
    savedRef.current = false;

    const nextSeed = bumpSeed ? sessionSeed + 1 : sessionSeed;

    if (bumpSeed) {
      setSessionSeed(nextSeed);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageSeedKey, String(nextSeed));
      }
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
    setGeneratedSession(null);
    setGenerationError(null);
    setCurrentStreak(0);
  };

  const requestAiExplanation = async (
    questionText: string,
    options: string[],
    correctAnswer: string,
    baseExplanation: string,
  ) => {
    // Show a quick local explanation immediately while AI response is loading.
    setAiExplanation(baseExplanation || `Final Answer: ${correctAnswer}`);
    setAiLoading(true);
    setAiError("");

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

      setAiExplanation(data?.explanation || baseExplanation || "No explanation returned by AI.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch AI explanation.";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDifficulty = (nextDifficulty: Difficulty) => {
    startNewSession(false);
    setDifficulty(nextDifficulty);

    const cachedSession = cachedSessions[nextDifficulty];
    if (cachedSession?.length) {
      setGeneratedSession(cachedSession);
      setGenerationError(null);
      setIsGeneratingSession(false);
    }
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
      setCurrentStreak(0);
      setWrongCount((prev) => prev + 1);
      const fallbackOptions = currentQuestion.options;
      const localizedOptions = data?.options ?? fallbackOptions;
      const correctAnswer = localizedOptions[currentQuestion.answerIndex] ?? String(fallbackOptions[currentQuestion.answerIndex] ?? "");
      const baseExplanation = data?.explanation ?? currentQuestion.explanation ?? "";

      void requestAiExplanation(
        displayQuestion || (data?.question ?? currentQuestion.question),
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

  if (generationError) {
    return (
      <main className="min-h-screen bg-[#FFFBF5] font-sans">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-black text-gray-800">Unable to generate questions.</h1>
          <p className="mt-2 text-sm text-gray-500">{generationError}</p>
          <button
            type="button"
            onClick={() => {
              void fetchGeneratedSession(sessionSeed + 101);
            }}
            className="mt-4 rounded-xl bg-[#E91E63] px-4 py-2 text-sm font-bold text-white"
          >
            {text.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  if (isGeneratingSession || total === 0) {
    return (
      <main className="min-h-screen bg-[#FFFBF5] font-sans">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-black text-gray-800">{text.generatingQuestions}</h1>
          <p className="mt-2 text-sm text-gray-500">Please wait while a fresh session is prepared.</p>
          <button
            type="button"
            onClick={() => {
              void fetchGeneratedSession(sessionSeed + 101);
            }}
            className="mt-4 rounded-xl bg-[#E91E63] px-4 py-2 text-sm font-bold text-white"
          >
            {text.tryAgain}
          </button>
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

      <nav className="relative flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 bg-white/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl">
        <BrandLogo />
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/${topic}`} className="text-sm font-semibold text-[#E91E63] hover:text-pink-700">
            {text.learnConcept}
          </Link>
        </div>
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

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>{text.correct}: {correctCount}</span>
              <span>{text.wrong}: {wrongCount}</span>
            </div>

            {isGeneratingSession ? (
              <p className="mt-3 text-xs font-medium text-sky-300">⏳ {text.generatingQuestions}</p>
            ) : null}

            {generationError ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-bold">{generationError}</p>
                <button
                  type="button"
                  onClick={() => {
                    void fetchGeneratedSession(sessionSeed + 101);
                  }}
                  className="mt-3 rounded-xl bg-[#E91E63] px-4 py-2 text-sm font-bold text-white"
                >
                  {text.tryAgain}
                </button>
              </div>
            ) : null}

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

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-gray-800">{displayQuestion || data.question}</h2>

              <div className="mt-6 space-y-3">
                {(data.options || []).map((option, optionIndex) => {
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
                {submitted ? `${isCorrect ? text.correctFeedback : text.incorrect} ${data?.explanation ?? ""}` : text.chooseOption}
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

