"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSelect from "@/components/LanguageSelect";
import { getLocalizedTopicContent, getUiText } from "@/lib/language";
import { topicsData } from "@/lib/topicsData";

export default function TopicContentClient({ topic }: { topic: keyof typeof topicsData }) {
  const { language } = useLanguage();
  const text = getUiText(language);
  const data = getLocalizedTopicContent(topic, language);
  const videoId = topicsData[topic].videoId;
  const youtubeUrl =
    videoId.startsWith("http://") || videoId.startsWith("https://")
      ? videoId
      : `https://youtube.com/watch?v=${videoId}`;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#FFFBF5] min-h-screen pb-20">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <a href="/tool" className="text-gray-400 text-sm flex items-center gap-1 mb-4 hover:text-orange-500">
            ← {text.backToTopics}
          </a>
          <h1 className="text-3xl font-black text-gray-800">{data.title}</h1>
          <p className="text-gray-400 text-sm">{text.learnConcept}</p>
        </div>
        <LanguageSelect className="bg-white" />
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-sm mb-6">
        <h2 className="text-orange-600 font-bold flex items-center gap-2 mb-4">📖 {text.theory}</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{data.theory}</p>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-sm mb-6">
        <h2 className="text-orange-600 font-bold flex items-center gap-2 mb-4">📝 {text.formula}</h2>
        <div className="bg-gray-50 p-4 rounded-2xl font-mono text-xs text-gray-700 leading-loose">
          {data.formula.split("\n").map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-orange-400">•</span> {line}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-sm mb-6">
        <h2 className="text-green-600 font-bold flex items-center gap-2 mb-4">✅ {text.solvedExamples}</h2>
        <div className="space-y-4">
          {data.examples?.map((example, i) => (
            <div key={i} className="bg-gray-50 p-5 rounded-2xl">
              <p className="font-bold text-gray-800 text-sm mb-2 font-mono">Q: {example.q}</p>
              <p className="text-green-600 text-sm font-medium font-mono">A: {example.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-orange-100 shadow-sm mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4 px-4">
          <div className="text-red-500 text-2xl">▶️</div>
          <div>
            <p className="font-bold text-sm text-gray-800">{text.watchVideo}</p>
            <p className="text-xs text-gray-400">YouTube</p>
          </div>
        </div>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-4 text-gray-400 hover:text-orange-500">
          ↗️
        </a>
      </div>

      <Link
        href={`/${topic}/practice`}
        className="block w-full bg-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 transition-all text-lg active:scale-95 text-center"
      >
        {text.letsGo} →
      </Link>
    </div>
  );
}
