import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { clearUserProgress } from "@/lib/userProgress";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearUserProgress(session.user.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] Failed to clear progress:", error);
    return NextResponse.json(
      { error: "Progress storage is unavailable. MongoDB is required." },
      { status: 503 },
    );
  }
}
