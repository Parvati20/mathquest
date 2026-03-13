"use client";

import Link from "next/link";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/components/LanguageProvider";
import { getUiText } from "@/lib/language";

export default function MockTestIntroClient() {
  const { language } = useLanguage();
  const text = getUiText(language);

  return (
    <main className="min-h-screen bg-[#FFFBF5] font-sans">
      <nav className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-md">
        <span className="font-bold text-gray-700">{text.appName}</span>
        <div className="flex items-center gap-3">
          <LanguageSelect className="bg-white" />
          <Link href="/tool" className="text-sm font-semibold text-gray-500 hover:text-orange-500">
            {text.backToTopics}
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl">📝</p>
        <h1 className="mt-5 text-4xl font-black text-gray-800">{text.mockInterview}</h1>
        <p className="mt-2 text-gray-500">{text.twentyQuestions}</p>
        <p className="mt-4 max-w-lg text-sm text-gray-500">{text.mockIntro}</p>

        <Link
          href="/mock-test/start"
          className="mt-8 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-10 py-4 text-lg font-black text-white shadow-xl shadow-orange-200 transition-transform hover:scale-105"
        >
          🚀 {text.takeMock} →
        </Link>
      </section>
    </main>
  );
}
