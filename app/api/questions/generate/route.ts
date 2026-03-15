import { NextResponse } from "next/server";
import { generateMathQuestions } from "@/lib/nvidia";
import type { Difficulty } from "@/lib/questionsData";

const allowedDifficulties: Difficulty[] = ["easy", "medium", "hard"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const difficulty = typeof body.difficulty === "string" ? body.difficulty.trim() : "";
    const count = typeof body.count === "number" ? body.count : 25;
    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "English";

    if (!topic || !allowedDifficulties.includes(difficulty as Difficulty)) {
      return NextResponse.json({ error: "Valid topic and difficulty are required." }, { status: 400 });
    }

    const questions = await generateMathQuestions({
      topic,
      difficulty: difficulty as Difficulty,
      count,
      language,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Question generation route error:", error);
    return NextResponse.json({ error: "Unable to generate questions right now." }, { status: 500 });
  }
}
