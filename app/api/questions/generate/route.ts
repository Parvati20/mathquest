import { NextResponse } from "next/server";
import { generateMathQuestions } from "@/lib/nvidia";
import type { Difficulty } from "@/lib/questionsData";

const allowedDifficulties: Difficulty[] = ["easy", "medium", "hard"];

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

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : "";
    const count = typeof body.count === "number" ? body.count : 20;
    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "English";
    const variationSeed = typeof body.variationSeed === "number" || typeof body.variationSeed === "string"
      ? body.variationSeed
      : undefined;
    const blockedQuestionSignatures = Array.isArray(body.blockedQuestionSignatures)
      ? body.blockedQuestionSignatures
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value: string) => value.trim())
          .filter(Boolean)
          .slice(0, 300)
      : [];

    if (!topic || !allowedDifficulties.includes(difficulty as Difficulty)) {
      return NextResponse.json({ error: "Valid topic and difficulty are required." }, { status: 400 });
    }

    const difficultyValue = difficulty as Difficulty;
    const questions = await generateMathQuestions({
      topic,
      difficulty: difficultyValue,
      count,
      language,
      variationSeed,
      blockedQuestionSignatures,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Question generation route error:", error);
    return NextResponse.json(
      {
        error: "Unable to generate questions right now.",
        details: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 },
    );
  }
}
