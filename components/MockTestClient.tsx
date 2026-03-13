"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedQuestion, getLocalizedTopicContent, getUiText } from "@/lib/language";
import { questionsData, type TopicQuestion } from "@/lib/questionsData";
import { topicsData } from "@/lib/topicsData";

type MockQuestion = TopicQuestion & {
  topic: string;
  topicTitle: string;
};

const MOCK_QUESTION_COUNT = 20;
const MOCK_DURATION_SECONDS = 15 * 60;
const MARKS_PER_QUESTION = 4;

function buildMockSession(seed: number): MockQuestion[] {
  const topicEntries = Object.entries(questionsData);
  const topicCount = topicEntries.length;
  const basePerTopic = Math.floor(MOCK_QUESTION_COUNT / topicCount);
  const remainder = MOCK_QUESTION_COUNT % topicCount;
  const buckets: MockQuestion[][] = [];

  topicEntries.forEach(([topic, pool], topicIndex) => {
    const count = basePerTopic + (topicIndex < remainder ? 1 : 0);
    const start = (seed * (count + 3) + topicIndex * 5) % pool.length;
    const topicTitle = topicsData[topic as keyof typeof topicsData]?.title ?? topic;
    const selected: MockQuestion[] = [];

    for (let i = 0; i < count; i += 1) {
      const picked = pool[(start + i) % pool.length];
      selected.push({ ...picked, topic, topicTitle });
    }

    buckets.push(selected);
  });

  const mixed: MockQuestion[] = [];
  let cursor = 0;

  while (mixed.length < MOCK_QUESTION_COUNT) {
    let pushedInRound = false;

    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
      if (buckets[bucketIndex][cursor]) {
        mixed.push(buckets[bucketIndex][cursor]);
        pushedInRound = true;
      }
    }

    if (!pushedInRound) {
      break;
    }

    cursor += 1;
  }

  return mixed.slice(0, MOCK_QUESTION_COUNT);
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function MockTestClient() {
  const { language } = useLanguage();
  const [sessionSeed, setSessionSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(MOCK_QUESTION_COUNT).fill(null));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION_SECONDS);
  const [finished, setFinished] = useState(false);
  const savedRef = useRef(false);
  const text = getUiText(language);

  const questions = useMemo(() => buildMockSession(sessionSeed), [sessionSeed]);
  const currentQuestion = questions[currentIndex];
  const localizedCurrentQuestion = currentQuestion ? getLocalizedQuestion(currentQuestion, language) : null;

  useEffect(() => {
    if (finished) {
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
  }, [finished]);

  const submitCurrentAndNext = () => {
    if (selectedIndex === null) {
      return;
    }

    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selectedIndex;
    setAnswers(nextAnswers);

    if (currentIndex === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
  };

  const startNewMock = () => {
    savedRef.current = false;
    setSessionSeed((prev) => prev + 1);
    setCurrentIndex(0);
    setAnswers(Array(MOCK_QUESTION_COUNT).fill(null));
    setSelectedIndex(null);
    setTimeLeft(MOCK_DURATION_SECONDS);
    setFinished(false);
  };

  const correctCount = questions.reduce((score, question, index) => {
    return answers[index] === question.answerIndex ? score + 1 : score;
  }, 0);

  const answeredCount = answers.filter((item) => item !== null).length;
  const wrongCount = answeredCount - correctCount;
  const accuracy = Math.round((correctCount / questions.length) * 100);
  const score = correctCount * MARKS_PER_QUESTION;
  const maxScore = questions.length * MARKS_PER_QUESTION;

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    void fetch("/api/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "mock", correctCount, score }),
    });
  }, [finished, correctCount, score]);

  const wrongAttempts = questions
    .map((question, index) => ({
      question,
      selectedIndex: answers[index],
    }))
    .filter((item) => item.selectedIndex !== null && item.selectedIndex !== item.question.answerIndex)
    .slice(0, 10);

  const weakTopics = Object.entries(
    wrongAttempts.reduce<Record<string, number>>((acc, item) => {
      acc[item.question.topic] = (acc[item.question.topic] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => getLocalizedTopicContent(topic as keyof typeof topicsData, language).title);

  if (finished) {
    const perfect = correctCount === questions.length;

    return (
      <main className="min-h-screen bg-[#FFFBF5] font-sans">
        <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-md">
          <span className="font-bold text-gray-700">{text.appName}</span>
          <Link href="/tool" className="text-sm font-semibold text-orange-500 hover:text-orange-600">
            {text.backToTopics}
          </Link>
        </nav>

        <section className="relative mx-auto max-w-3xl px-6 py-10 text-center">
          {perfect ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <span className="confetti mega-confetti-1" />
              <span className="confetti mega-confetti-2" />
              <span className="confetti mega-confetti-3" />
              <span className="confetti mega-confetti-4" />
              <span className="confetti mega-confetti-5" />
              <span className="confetti mega-confetti-6" />
            </div>
          ) : null}

          <p className="text-5xl">🎉</p>
          <h1 className="mt-3 text-3xl font-black text-gray-800">
            {perfect ? text.fullMarks : text.testComplete}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {perfect ? text.perfectBody : text.retryBody}
          </p>

          <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-4">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-sm text-orange-600">{text.score}</p>
              <p className="text-3xl font-black text-orange-700">{score}/{maxScore}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-600">{text.accuracy}</p>
              <p className="text-3xl font-black text-emerald-700">{accuracy}%</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-600">{text.correct}</p>
              <p className="text-3xl font-black text-blue-700">{correctCount}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm text-rose-600">{text.wrong}</p>
              <p className="text-3xl font-black text-rose-700">{wrongCount}</p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-gray-200 bg-white p-4 text-left">
            <p className="text-sm font-bold text-gray-700">{text.weakTopics}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {weakTopics.length > 0 ? weakTopics.map((topic) => (
                <span key={topic} className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                  {topic}
                </span>
              )) : (
                <span className="text-sm text-emerald-600">{text.noWeakTopic}</span>
              )}
            </div>
          </div>

          {wrongAttempts.length > 0 ? (
            <div className="mx-auto mt-6 max-w-xl space-y-3 text-left">
              {wrongAttempts.map((item) => (
                <div key={item.question.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-bold text-red-700">{getLocalizedQuestion(item.question, language).question}</p>
                  <p className="mt-1 text-xs text-red-500">
                    {text.correctAnswer}: {item.question.options[item.question.answerIndex]}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tool"
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-orange-200 hover:text-orange-500"
            >
              {text.backToTopics}
            </Link>
            <button
              onClick={startNewMock}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition-transform hover:scale-105"
            >
              {text.tryAgain}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFBF5] font-sans">
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-md">
        <span className="font-bold text-gray-700">{text.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSelect className="bg-white" />
          <div className="rounded-full bg-yellow-100 px-4 py-1 text-sm font-black text-yellow-700">⏰ {formatTimer(timeLeft)}</div>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{text.question} {currentIndex + 1}/{questions.length}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">15:00 {text.timerRunning}</span>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
          />
        </div>

        <article className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-3xl font-black leading-tight text-gray-800">{localizedCurrentQuestion?.question}</h2>

          <div className="mt-6 space-y-3">
            {localizedCurrentQuestion?.options.map((option, optionIndex) => {
              const letter = String.fromCharCode(65 + optionIndex);
              const picked = selectedIndex === optionIndex;

              return (
                <button
                  key={letter}
                  onClick={() => setSelectedIndex(optionIndex)}
                  className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors ${
                    picked
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-orange-200"
                  }`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                    {letter}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </button>
              );
            })}
          </div>
        </article>

        <div className="mt-5 flex justify-end">
          <button
            onClick={submitCurrentAndNext}
            disabled={selectedIndex === null}
            className="rounded-xl bg-orange-500 px-8 py-3 font-bold text-white transition-all enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {currentIndex === questions.length - 1 ? text.submitTest : text.next}
          </button>
        </div>
      </section>
    </main>
  );
}
