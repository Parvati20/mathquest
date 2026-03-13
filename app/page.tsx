"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";

// Type definition for Props (Fixes the 'any' error)
interface FeatureCardProps {
  icon: string;
  color: string;
  title: string;
  desc: string;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-6">
        <div className="bg-orange-100 p-4 rounded-3xl shadow-sm">
          <span className="text-4xl">📚</span>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-[#2D2D2D] leading-tight">
          Crack the Math Interview <br />
          <span className="text-orange-500 italic">Like a Pro!</span>
        </h1>
        {/* Fix 1: Don't -> Don&apos;t */}
        <p className="text-gray-500 mt-4 max-w-sm mx-auto">
          Don&apos;t let math stop you from joining NavGurukul. We made it fun, easy & totally free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        <FeatureCard icon="⚡" color="bg-orange-400" title="Learn Fast" desc="Simple explanations that actually make sense" />
        <FeatureCard icon="🎯" color="bg-emerald-400" title="150+ Questions" desc="6 topics, 3 levels — Easy to Hard" />
        <FeatureCard icon="🧠" color="bg-purple-400" title="Get Smarter Daily" desc="Track progress & crush weak topics" />
        <FeatureCard icon="🏆" color="bg-yellow-400" title="Mock Test Ready" desc="Practice like the real interview" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/tool" })}
        className="w-full max-w-md bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-200 transition-all transform hover:scale-105 active:scale-95"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
          <Image src="/google.png" alt="Google" width={16} height={16} className="object-contain" />
        </span>
        {/* Fix 3: Let's -> Let&apos;s */}
        Let&apos;s Go — Sign in with Google →
      </button>
    </main>
  );
}

function FeatureCard({ icon, color, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-shadow">
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-[#2D2D2D] text-lg">{title}</h3>
      <p className="text-sm text-gray-400 leading-snug">{desc}</p>
    </div>
  );
}