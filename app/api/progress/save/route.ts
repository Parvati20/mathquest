import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { savePracticeSession, saveMockTest } from "@/lib/userProgress";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { type } = body as Record<string, unknown>;

    if (type === "practice") {
      const { topicId, correctCount, totalCount } = body as Record<string, unknown>;

      if (
        typeof topicId !== "string" ||
        typeof correctCount !== "number" ||
        typeof totalCount !== "number"
      ) {
        return NextResponse.json({ error: "Invalid fields for practice" }, { status: 400 });
      }

      await savePracticeSession(session.user.email, topicId, correctCount, totalCount);
      return NextResponse.json({ ok: true });
    }

    if (type === "mock") {
      const { correctCount, score, wrongCount, totalCount, weakTopicIds } = body as Record<string, unknown>;
      const safeWeakTopicIds = Array.isArray(weakTopicIds)
        ? weakTopicIds.filter((topicId): topicId is string => typeof topicId === "string" && topicId.trim().length > 0)
        : [];

      if (
        typeof correctCount !== "number" ||
        typeof score !== "number" ||
        typeof wrongCount !== "number" ||
        typeof totalCount !== "number"
      ) {
        return NextResponse.json({ error: "Invalid fields for mock" }, { status: 400 });
      }

      await saveMockTest(session.user.email, correctCount, score, wrongCount, totalCount, safeWeakTopicIds);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("[API] Failed to save progress:", error);
    return NextResponse.json(
      { error: "Progress storage is unavailable. MongoDB is required." },
      { status: 503 },
    );
  }
}
