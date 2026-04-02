import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { getUserProgress, repairUserProgress } from "@/lib/userProgress";
import { getMockEligibility } from "@/lib/mockEligibility";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getUserProgress(session.user.email);
  const repairedProgress = repairUserProgress(progress, session.user.email);

  return NextResponse.json({
    ...repairedProgress,
    mockEligibility: getMockEligibility(progress),
  });
}
