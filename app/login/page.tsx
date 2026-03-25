"use client";
export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
//   const callbackUrl = searchParams.get("callbackUrl") || "/tool";
const [callbackUrl, setCallbackUrl] = useState("/tool");


  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [router, status, callbackUrl]);

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">

      <nav className="flex items-center justify-between px-6 md:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Link href="/">
          <BrandLogo />
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#E91E63] transition-colors">
          ← Back to Home
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-[32px] shadow-2xl shadow-pink-100 border border-gray-100 p-10">

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#FF4081] flex items-center justify-center shadow-lg shadow-pink-200 text-3xl">
                🎯
              </div>
            </div>

            <h1 className="text-2xl font-black text-gray-900 text-center mb-2">
              Welcome to NavGurukul Math
            </h1>
            <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
              Sign in to access your personalised practice dashboard,<br />track progress, and crack the math interview.
            </p>

            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#E91E63] text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-lg hover:shadow-pink-100 active:scale-95 text-base group"
            >
              <Image src="/google.png" alt="Google" width={22} height={22} className="object-contain" />
              <span>Continue with Google</span>
              <span className="ml-auto text-gray-400 group-hover:text-[#E91E63] transition-colors">→</span>
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">100% free • no password needed</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🔒", label: "Secure Login" },
                { icon: "🆓", label: "Always Free" },
                { icon: "📱", label: "Works on Mobile" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl py-3">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-500">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to use this platform for learning purposes only.
          </p>
        </div>
      </div>

    </main>
  );
}
