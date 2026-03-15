"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getLocalizedQuestion,
  getLocalizedTopicContent,
  getUiText,
} from "@/lib/language";
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
    const topicTitle =
      topicsData[topic as keyof typeof topicsData]?.title ?? topic;
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

export default function MockTestClient() {
  const { language } = useLanguage();
  const [sessionSeed, setSessionSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(MOCK_QUESTION_COUNT).fill(null),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION_SECONDS);
  const [finished, setFinished] = useState(false);
  const [resultAnimated, setResultAnimated] = useState(false);
  const savedRef = useRef(false);
  const text = getUiText(language);

  const questions = useMemo(() => buildMockSession(sessionSeed), [sessionSeed]);
  const currentQuestion = questions[currentIndex];
  const localizedCurrentQuestion = currentQuestion
    ? getLocalizedQuestion(currentQuestion, language)
    : null;

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

  if (finished) {
    const perfect = correctCount === questions.length;
    const scorePercent =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] font-sans text-gray-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-8%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(233,30,99,0.10)_0%,_rgba(233,30,99,0.02)_42%,_transparent_72%)] blur-3xl" />
          <div className="absolute right-[-8%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.08)_0%,_rgba(59,130,246,0.02)_45%,_transparent_74%)] blur-3xl" />
        </div>

        <nav className="relative flex items-center justify-between border-b border-white/70 bg-white/70 px-8 py-4 backdrop-blur-md">
          <span className="font-bold text-gray-700">{text.appName}</span>
          <Link
            href="/tool"
            className="text-sm font-semibold text-[#E91E63] hover:text-[#c2185b]"
          >
            {text.backToTopics}
          </Link>
        </nav>

        <section className="relative mx-auto max-w-5xl px-6 py-10">
          <div className="pointer-events-none absolute inset-x-6 top-10 h-44 rounded-[2rem] bg-[radial-gradient(circle,_rgba(233,30,99,0.14)_0%,_rgba(233,30,99,0.03)_55%,_transparent_72%)]" />
          <div className="pointer-events-none absolute inset-x-6 top-0 overflow-hidden rounded-3xl">
            <span className="confetti mega-confetti-1" />
            <span className="confetti mega-confetti-2" />
            <span className="confetti mega-confetti-3" />
            <span className="confetti mega-confetti-4" />
            <span className="confetti mega-confetti-5" />
            <span className="confetti mega-confetti-6" />
          </div>

          <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="text-center">
              <p className="text-5xl">🏆</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">
                {perfect ? text.fullMarks : text.testComplete}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
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

            <div className="mx-auto mt-4 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-4 shadow-[0_0_20px_rgba(16,185,129,0.16)]">
                <p className="text-sm font-bold text-emerald-700">
                  {text.correct}
                </p>
                <p className="mt-1 text-3xl font-black text-emerald-700">
                  {correctCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 shadow-[0_0_20px_rgba(244,63,94,0.16)]">
                <p className="text-sm font-bold text-rose-700">{text.wrong}</p>
                <p className="mt-1 text-3xl font-black text-rose-700">
                  {wrongCount}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/80 bg-white/80 p-4 text-left shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-bold text-gray-700">
                {text.weakTopics}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakTopics.length > 0 ? (
                  weakTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center gap-2 rounded-full border border-[#E91E63]/20 bg-[#fff1f6] px-3 py-1 text-xs font-bold text-[#E91E63]"
                    >
                      <span>{topic.title}</span>
                      <Link
                        href={`/${topic.id}`}
                        className="rounded-full border border-[#E91E63]/30 bg-white px-2 py-0.5 text-[10px] font-black text-[#E91E63] hover:bg-[#E91E63] hover:text-white"
                      >
                        Review Now
                      </Link>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-emerald-600">
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
                    className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.05)]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                        Incorrect
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {
                          getLocalizedTopicContent(
                            item.question.topic as keyof typeof topicsData,
                            language,
                          ).title
                        }
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {item?.question &&
                        getLocalizedQuestion(item.question, language)?.question}
                    </p>
                    <p className="mt-1 text-xs text-rose-500">
                      {text.correctAnswer}:{" "}
                      {item?.question?.options?.[item?.question?.answerIndex]}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/tool"
                className="rounded-xl border border-[#E91E63]/35 bg-white/35 px-5 py-3 text-sm font-bold text-[#E91E63] backdrop-blur-md transition-colors hover:bg-[#E91E63]/10"
              >
                {text.backToTopics}
              </Link>
              <button
                onClick={startNewMock}
                className="rounded-xl bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] px-6 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(233,30,99,0.26)] transition-transform hover:scale-105"
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

      <nav className="relative flex items-center justify-between border-b border-white/70 bg-white/70 px-8 py-4 backdrop-blur-md">
        <span className="font-bold text-gray-700">{text.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSelect className="bg-white" />
          <div className="rounded-full border border-[#E91E63]/15 bg-gradient-to-r from-[#E91E63]/12 to-[#FF8A65]/12 px-4 py-1.5 text-sm font-black text-[#E91E63] shadow-[0_0_22px_rgba(233,30,99,0.12)]">
            ⏰ {formatTimer(timeLeft)}
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {text.question} {currentIndex + 1}/{questions.length}
          </span>
          <span className="rounded-full border border-[#E91E63]/15 bg-white/80 px-3 py-1 text-xs font-bold text-[#E91E63] shadow-[0_10px_20px_rgba(233,30,99,0.08)]">
            15:00 {text.timerRunning}
          </span>
        </div>

        <div className="mt-3 h-4 w-full rounded-full bg-white/80 p-1 shadow-inner shadow-slate-200/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E91E63] via-[#FF4081] to-[#FF8A65] shadow-[0_0_20px_rgba(233,30,99,0.18)] transition-all"
            style={{
              width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`,
            }}
          />
        </div>

        <article className="mt-6 rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-md">
          <h2 className="text-3xl font-black leading-tight text-gray-800">
            {localizedCurrentQuestion?.question}
          </h2>

          <div className="mt-6 space-y-3">
            {localizedCurrentQuestion?.options.map((option, optionIndex) => {
              const letter = String.fromCharCode(65 + optionIndex);
              const picked = selectedIndex === optionIndex;

              return (
                <button
                  key={letter}
                  onClick={() => setSelectedIndex(optionIndex)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                    picked
                      ? "border-[#E91E63]/35 bg-[#fff1f6] shadow-[0_12px_24px_rgba(233,30,99,0.10)]"
                      : "border-white/70 bg-white/75 hover:-translate-y-1 hover:border-[#E91E63]/25 hover:bg-[#fff7fa] hover:shadow-[0_14px_30px_rgba(233,30,99,0.08)]"
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white shadow-[0_12px_24px_rgba(15,23,42,0.10)] ${
                      picked
                        ? "bg-gradient-to-br from-[#E91E63] to-[#FF8A65]"
                        : "bg-gradient-to-br from-slate-400 to-slate-500"
                    }`}
                  >
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
            {currentIndex === questions.length - 1
              ? text.submitTest
              : text.next}
          </button>
        </div>
      </section>
    </main>
  );
}
