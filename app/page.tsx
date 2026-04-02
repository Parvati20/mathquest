"use client";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";

interface FeatureCardProps {
  icon: string;
  gradFrom: string;
  gradTo: string;
  title: string;
  desc: string;
}

export default function Home() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans overflow-x-hidden">

      <nav className="flex items-center justify-between px-6 md:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <BrandLogo />

        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-[#E91E63] transition-colors px-2">
            Home
          </Link>
          {isLoggedIn ? (
            <Link
              href="/tool"
              className="flex items-center gap-2 bg-[#E91E63] hover:bg-[#c2185b] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-pink-200 active:scale-95"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-[#E91E63] hover:bg-[#c2185b] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-pink-200 active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-6">

        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse" />
            <span className="text-[#E91E63] text-xs font-bold tracking-wide uppercase">Free for NavGurukul Students</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.05] mb-5">
            Crack the<br />
            Math Interview<br />
            <span className="relative inline-block">
              <span className="text-[#E91E63] italic">Like a Pro!</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                <path d="M0 6 Q75 0 150 4 Q225 8 300 2" stroke="#E91E63" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
              </svg>
            </span>
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
            Don&apos;t let math stop you from joining NavGurukul. We made it <strong className="text-gray-700">fun, easy</strong> &amp; totally free.
          </p>

          {isLoggedIn ? (
            <Link
              href="/tool"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#E91E63] to-[#FF4081] hover:from-[#c2185b] hover:to-[#E91E63] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-pink-200 transition-all hover:scale-105 active:scale-95 text-lg w-fit"
            >
              Go to Dashboard
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#E91E63] to-[#FF4081] hover:from-[#c2185b] hover:to-[#E91E63] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-pink-200 transition-all hover:scale-105 active:scale-95 text-lg w-fit"
            >
              Get Started Free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}

          <div className="flex items-center gap-5 mt-5">
            {["100% Free", "No Sign-up Fee", "Works on Mobile"].map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <span className="text-[#E91E63]">✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <StudentIllustration />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>

      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#E91E63] mb-2">Why NavGurukul Math?</p>
        <h2 className="text-center text-3xl font-black text-gray-900 mb-10">Everything you need to clear the interview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            icon="⚡"
            gradFrom="from-orange-400"
            gradTo="to-amber-500"
            title="Learn Fast"
            desc="Simple explanations that actually make sense"
          />
          <FeatureCard
            icon="🎯"
            gradFrom="from-[#E91E63]"
            gradTo="to-[#FF4081]"
            title="150+ Questions"
            desc="6 topics, 3 levels — Easy to Hard"
          />
          <FeatureCard
            icon="🧠"
            gradFrom="from-purple-500"
            gradTo="to-violet-600"
            title="Get Smarter Daily"
            desc="Track progress & crush weak topics"
          />
          <FeatureCard
            icon="🏆"
            gradFrom="from-emerald-400"
            gradTo="to-teal-500"
            title="Mock Test Ready"
            desc="Practice like the real interview"
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#E91E63] to-[#FF4081] rounded-3xl px-10 py-12 text-center shadow-2xl shadow-pink-200">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-3">Ready to start?</p>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
            Your NavGurukul journey<br />starts here 🚀
          </h3>
          {isLoggedIn ? (
            <Link
              href="/tool"
              className="inline-flex items-center gap-3 bg-white text-[#E91E63] font-black py-4 px-10 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-lg"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/tool" })}
              className="inline-flex items-center gap-3 bg-white text-[#E91E63] font-black py-4 px-10 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-lg"
            >
              <Image src="/google.png" alt="Google" width={20} height={20} className="object-contain" />
              Get Started Free →
            </button>
          )}
        </div>
      </section>

    </main>
  );
}

function StudentIllustration() {
  return (
    <div className="relative w-[340px] h-[380px] md:w-[420px] md:h-[460px]">
      <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-pink-50 to-purple-50 shadow-inner" />
      <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-[#E91E63]/10 blur-3xl" />
      <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-purple-200/40 blur-2xl" />
      <Image
        src="/student.png"
        alt="Student solving math problems in notebook while using a computer"
        fill
        className="rounded-[40px] object-cover"
        priority
      />
    </div>
  );
}

function FeatureCard({ icon, gradFrom, gradTo, title, desc }: FeatureCardProps) {
  return (
    <div className="group bg-white border border-gray-100 p-6 rounded-[28px] shadow-sm hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1 transition-all duration-200 cursor-default">
      <div className={`bg-gradient-to-br ${gradFrom} ${gradTo} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-black text-gray-800 text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-400 leading-snug">{desc}</p>
    </div>
  );
}