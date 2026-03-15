"use client";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface FeatureCardProps {
  icon: string;
  gradFrom: string;
  gradTo: string;
  title: string;
  desc: string;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        {/* NavGurukul Logo */}
        <div className="flex items-center gap-1 select-none">
          <span className="text-[22px] font-black tracking-tight text-[#E91E63]">nav</span>
          <span className="text-[22px] font-black tracking-tight text-gray-800">gurukul</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-[#E91E63] text-white uppercase tracking-widest">math</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-[#E91E63] transition-colors px-2">
            Home
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 bg-[#E91E63] hover:bg-[#c2185b] text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-pink-200 active:scale-95"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-6">

        {/* Left: Text */}
        <div className="flex-1 max-w-xl">
          {/* Badge */}
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

          {/* CTA Button */}
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#E91E63] to-[#FF4081] hover:from-[#c2185b] hover:to-[#E91E63] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-pink-200 transition-all hover:scale-105 active:scale-95 text-lg w-fit"
          >
            Get Started Free
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <div className="flex items-center gap-5 mt-5">
            {["100% Free", "No Sign-up Fee", "Works on Mobile"].map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <span className="text-[#E91E63]">✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Student Illustration */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <StudentIllustration />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>

      {/* ── FEATURES ── */}
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

      {/* ── BOTTOM CTA BANNER ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#E91E63] to-[#FF4081] rounded-3xl px-10 py-12 text-center shadow-2xl shadow-pink-200">
          {/* decorative circles */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-3">Ready to start?</p>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
            Your NavGurukul journey<br />starts here 🚀
          </h3>
          <button
            onClick={() => signIn("google", { callbackUrl: "/tool" })}
            className="inline-flex items-center gap-3 bg-white text-[#E91E63] font-black py-4 px-10 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-lg"
          >
            <Image src="/google.png" alt="Google" width={20} height={20} className="object-contain" />
            Get Started Free →
          </button>
        </div>
      </section>

    </main>
  );
}

/* ── STUDENT ILLUSTRATION SVG ── */
function StudentIllustration() {
  return (
    <div className="relative w-[340px] h-[380px] md:w-[420px] md:h-[460px]">
      {/* Floating glow bg */}
      <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-pink-50 to-purple-50 shadow-inner" />
      <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-[#E91E63]/10 blur-3xl" />
      <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-purple-200/40 blur-2xl" />

      {/* Floating math tokens */}
      <FloatBadge className="top-6 left-6 animate-bounce" delay="0s" bg="bg-[#E91E63]" text="x²+y²" />
      <FloatBadge className="top-12 right-4 animate-bounce" delay="0.3s" bg="bg-purple-500" text="15%" />
      <FloatBadge className="bottom-16 left-4 animate-bounce" delay="0.6s" bg="bg-emerald-500" text="SI=PRT/100" small />
      <FloatBadge className="bottom-8 right-10 animate-bounce" delay="0.2s" bg="bg-amber-500" text="🏆" />

      {/* Central student SVG */}
      <svg
        viewBox="0 0 260 320"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 md:w-64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Desk */}
        <rect x="20" y="240" width="220" height="14" rx="7" fill="#E91E63" opacity="0.15"/>
        <rect x="50" y="254" width="16" height="50" rx="6" fill="#E91E63" opacity="0.1"/>
        <rect x="194" y="254" width="16" height="50" rx="6" fill="#E91E63" opacity="0.1"/>

        {/* Laptop */}
        <rect x="55" y="185" width="150" height="58" rx="8" fill="#1a1a2e"/>
        <rect x="62" y="191" width="136" height="46" rx="5" fill="#0f3460"/>
        {/* Screen content */}
        <rect x="70" y="198" width="60" height="5" rx="2" fill="#E91E63" opacity="0.8"/>
        <rect x="70" y="207" width="80" height="4" rx="2" fill="white" opacity="0.3"/>
        <rect x="70" y="215" width="50" height="4" rx="2" fill="white" opacity="0.2"/>
        <rect x="140" y="198" width="48" height="34" rx="4" fill="#E91E63" opacity="0.15"/>
        <text x="152" y="220" fontSize="18" fill="#E91E63" opacity="0.9">📊</text>
        {/* Laptop base */}
        <rect x="40" y="243" width="180" height="8" rx="4" fill="#1a1a2e"/>

        {/* Body */}
        <rect x="100" y="128" width="60" height="70" rx="20" fill="#FDBCB4"/>
        {/* Shirt */}
        <path d="M85 185 Q100 200 130 198 Q160 200 175 185 L170 260 L90 260 Z" fill="#E91E63"/>
        {/* Collar */}
        <path d="M115 198 L130 215 L145 198" stroke="white" strokeWidth="2" fill="none"/>

        {/* Head */}
        <ellipse cx="130" cy="105" rx="32" ry="36" fill="#FDBCB4"/>
        {/* Hair */}
        <path d="M98 90 Q100 60 130 58 Q160 60 162 90 Q155 72 130 70 Q105 72 98 90Z" fill="#2D1B00"/>
        <path d="M98 90 Q94 105 96 118 Q98 88 108 82Z" fill="#2D1B00"/>
        <path d="M162 90 Q166 105 164 118 Q162 88 152 82Z" fill="#2D1B00"/>

        {/* Eyes */}
        <ellipse cx="118" cy="105" rx="5" ry="6" fill="white"/>
        <ellipse cx="142" cy="105" rx="5" ry="6" fill="white"/>
        <circle cx="119" cy="106" r="3.5" fill="#1a1a2e"/>
        <circle cx="143" cy="106" r="3.5" fill="#1a1a2e"/>
        <circle cx="120" cy="105" r="1" fill="white"/>
        <circle cx="144" cy="105" r="1" fill="white"/>
        {/* Eyebrows */}
        <path d="M112 97 Q118 93 124 97" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
        <path d="M136 97 Q142 93 148 97" stroke="#2D1B00" strokeWidth="2" strokeLinecap="round"/>
        {/* Smile */}
        <path d="M120 116 Q130 124 140 116" stroke="#c97b6b" strokeWidth="2" strokeLinecap="round" fill="none"/>

        {/* Left arm (pointing at screen) */}
        <path d="M100 155 Q80 170 72 190" stroke="#FDBCB4" strokeWidth="14" strokeLinecap="round"/>
        {/* Right arm (resting on desk) */}
        <path d="M160 155 Q175 170 172 195" stroke="#FDBCB4" strokeWidth="14" strokeLinecap="round"/>

        {/* Pencil in left hand */}
        <rect x="64" y="186" width="5" height="22" rx="2" fill="#FFC107" transform="rotate(-20 64 186)"/>
        <polygon points="64,208 69,208 66.5,218" fill="#FF7043" transform="rotate(-20 64 199)"/>

        {/* Headphones */}
        <path d="M98 92 Q97 70 130 68 Q163 70 162 92" stroke="#1a1a2e" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="93" y="90" width="10" height="16" rx="5" fill="#1a1a2e"/>
        <rect x="157" y="90" width="10" height="16" rx="5" fill="#1a1a2e"/>
      </svg>

      {/* Score badge */}
      <div className="absolute bottom-12 right-6 bg-white rounded-2xl px-4 py-3 shadow-xl border border-pink-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#FF4081] flex items-center justify-center text-white text-sm font-black">A</div>
        <div>
          <p className="text-xs text-gray-400 leading-none">Score</p>
          <p className="font-black text-gray-800 text-sm">95 / 100</p>
        </div>
      </div>

      {/* AI mentor badge */}
      <div className="absolute top-10 right-6 bg-white rounded-2xl px-3 py-2 shadow-lg border border-purple-100 flex items-center gap-1.5">
        <span className="text-base">🤖</span>
        <span className="text-xs font-bold text-purple-700">AI Mentor</span>
      </div>
    </div>
  );
}

function FloatBadge({ className, delay, bg, text, small }: { className: string; delay: string; bg: string; text: string; small?: boolean }) {
  return (
    <div
      className={`absolute ${className} ${bg} text-white font-black rounded-xl px-2.5 py-1 shadow-lg z-10 ${small ? "text-[9px]" : "text-xs"}`}
      style={{ animationDelay: delay, animationDuration: "3s" }}
    >
      {text}
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