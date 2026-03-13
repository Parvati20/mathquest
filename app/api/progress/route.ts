import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { getUserProgress } from "@/lib/userProgress";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getUserProgress(session.user.email);

  return NextResponse.json(
    progress ?? {
      totalSolved: 0,
      totalPoints: 0,
      topicProgress: {},
      mockAttempts: 0,
      mockBestScore: 0,
    },
  );
}
