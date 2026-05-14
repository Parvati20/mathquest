import { NextResponse } from "next/server";
import { getMathExplanation } from "@/lib/nvidia";

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
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const options = Array.isArray(body.options)
      ? body.options.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim()).filter(Boolean)
      : [];
    const correctAnswer = typeof body.correctAnswer === "string" ? body.correctAnswer.trim() : "";
    const baseExplanation = typeof body.baseExplanation === "string" ? body.baseExplanation.trim() : "";
    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "English";

    if (!topic || !question || !correctAnswer || options.length === 0) {
      return NextResponse.json({
        explanation:
          baseExplanation ||
          (correctAnswer ? `Final Answer: ${correctAnswer}` : "Explanation unavailable right now."),
      });
    }

    const explanation = await getMathExplanation(topic, question, options, correctAnswer, baseExplanation, language);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain route error:", error);
    return NextResponse.json(
      { error: "Unable to generate explanation right now." },
      { status: 500 },
    );
  }
}
