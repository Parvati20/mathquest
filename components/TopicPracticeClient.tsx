"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedDifficultyLabel, getLocalizedQuestion, getLocalizedTopicContent, getUiText } from "@/lib/language";
import { topicsData } from "@/lib/topicsData";
import type { Difficulty, TopicQuestion } from "@/lib/questionsData";

type TopicPracticeClientProps = {
  topic: string;
  topicTitle: string;
  questions: TopicQuestion[];
};

const SESSION_SIZE = 25;
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

function pickSession<T>(items: T[], count: number, seed: number) {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.min(count, items.length);
  const start = (seed * count) % items.length;
  const session: T[] = [];

  for (let i = 0; i < limit; i += 1) {
    session.push(items[(start + i) % items.length]);
  }

  return session;
}

export default function TopicPracticeClient({ topic, topicTitle, questions }: TopicPracticeClientProps) {
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
  const savedRef = useRef(false);
  const text = getUiText(language);

  const pool = useMemo(
    () => questions.filter((question) => question.difficulty === difficulty),
    [difficulty, questions],
  );

  const sessionQuestions = useMemo(() => pickSession(pool, SESSION_SIZE, sessionSeed), [pool, sessionSeed]);
  const currentQuestion = sessionQuestions[index];
  const localizedTopic = getLocalizedTopicContent(topic as keyof typeof topicsData, language);
  const localizedCurrentQuestion = currentQuestion ? getLocalizedQuestion(currentQuestion, language) : null;

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    void fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "practice",
        topicId: topic,
        correctCount,
        totalCount: sessionQuestions.length,
      }),
    });
  }, [finished, topic, correctCount, sessionQuestions.length]);

  const startNewSession = (nextDifficulty: Difficulty = difficulty) => {
    savedRef.current = false;
    setDifficulty(nextDifficulty);
    setSessionSeed((prev) => prev + 1);
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
  };

  const requestAiExplanation = async (questionText: string) => {
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
    startNewSession(nextDifficulty);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || !currentQuestion) {
      return;
    }

    const isCorrect = selectedIndex === currentQuestion.answerIndex;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setBurstTick((prev) => prev + 1);
      setAiExplanation("");
      setAiError("");
      setAiLoading(false);
    } else {
      setWrongCount((prev) => prev + 1);
      void requestAiExplanation(localizedCurrentQuestion?.question ?? currentQuestion.question);
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    const isLast = index >= sessionQuestions.length - 1;

    if (isLast) {
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
  const progressPercent = total > 0 ? Math.round((questionNumber / total) * 100) : 0;
  const marks = correctCount * 4;
  const maxMarks = total * 4;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

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
          <span className="font-bold text-gray-700">{text.appName}</span>
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
              onClick={() => startNewSession(difficulty)}
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
    <main className="min-h-screen bg-[#FFFBF5] font-sans">
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-3 backdrop-blur-md">
        <span className="font-bold text-gray-700">{text.appName}</span>
        <Link href={`/${topic}`} className="text-sm font-semibold text-orange-500 hover:text-orange-600">
          {text.learnConcept}
        </Link>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <Link href={`/${topic}`} className="text-sm text-gray-500 hover:text-orange-500">
          &larr; {localizedTopic.title}
        </Link>

        <div className="mt-5 flex flex-wrap gap-3 items-center">
          {difficulties.map((item) => (
            <button
              key={item}
              onClick={() => handleDifficulty(item)}
              className={`rounded-full border px-4 py-1 text-sm font-medium capitalize transition-colors ${
                difficulty === item
                  ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500"
              }`}
            >
              {getLocalizedDifficultyLabel(item, language)}
            </button>
          ))}
          <LanguageSelect className="bg-white py-1" />
        </div>

        <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
          <span>{text.question} {questionNumber} {text.of} {total}</span>
          <span className="capitalize">{getLocalizedDifficultyLabel(difficulty, language)}</span>
        </div>

        <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{text.correct}: {correctCount}</span>
          <span>{text.wrong}: {wrongCount}</span>
        </div>

        <article className="relative mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          {burstTick > 0 && submitted && isCorrect ? (
            <div key={burstTick} className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="confetti confetti-a" />
              <span className="confetti confetti-b" />
              <span className="confetti confetti-c" />
              <span className="confetti confetti-d" />
            </div>
          ) : null}

          <h2 className="text-3xl font-black leading-tight text-gray-800">{localizedCurrentQuestion?.question}</h2>

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
                  className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors ${
                    showCorrect
                      ? "border-emerald-300 bg-emerald-50"
                      : showWrong
                        ? "border-red-300 bg-red-50"
                        : isPicked
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-orange-200"
                  }`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                    {optionLetter}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </button>
              );
            })}
          </div>
        </article>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className={`text-sm font-semibold ${submitted ? (isCorrect ? "text-emerald-600" : "text-red-600") : "text-gray-400"}`}>
            {submitted
              ? `${isCorrect ? text.correctFeedback : text.incorrect} ${localizedCurrentQuestion?.explanation ?? ""}`
              : text.chooseOption}
          </p>

          <button
            onClick={submitted ? handleNext : handleSubmit}
            disabled={!submitted && selectedIndex === null}
            className="rounded-xl bg-orange-500 px-8 py-3 font-bold text-white transition-all enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {submitted ? (index === total - 1 ? text.showResult : text.next) : text.submit}
          </button>
        </div>

        {!isCorrect && submitted ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-700">{text.aiMentor} ({language})</p>
            {aiLoading ? <p className="mt-2 text-sm text-blue-600">{text.generating}</p> : null}
            {aiError ? <p className="mt-2 text-sm text-red-600">{aiError}</p> : null}
            {aiExplanation ? <p className="mt-2 text-sm leading-relaxed text-gray-700">{aiExplanation}</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
