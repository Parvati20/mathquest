import { NextResponse } from "next/server";
import { generateFastQuestions } from "../../../../lib/nvidia";
import type { Difficulty } from "@/lib/questionsData";

const allowedDifficulties: Difficulty[] = ["easy", "medium", "hard"];

// Keep the route timeout long enough for Groq to answer, but still bounded.
const API_TIMEOUT = 15000;

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { topic, difficulty, language = "English", blockedQuestionSignatures = [] } = body;
    const count = Math.min(body.count || 5, 5);

    if (!topic || !allowedDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    console.log(`📨 Generate: ${topic} | ${difficulty} | ${language}`);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), API_TIMEOUT)
    );

    const questions = (await Promise.race([
      generateFastQuestions({
        topic,
        difficulty,
        count,
        language,
        blockedQuestionSignatures: Array.isArray(blockedQuestionSignatures)
          ? blockedQuestionSignatures
          : [],
      }),
      timeout,
    ])) as unknown[];

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions generated" }, { status: 503 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}