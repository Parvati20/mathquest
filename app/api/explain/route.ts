import { NextResponse } from "next/server";
import { getMathExplanation } from "@/lib/nvidia";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "Hindi";

    if (!topic || !question) {
      return NextResponse.json(
        { error: "Both topic and question are required." },
        { status: 400 },
      );
    }

    const explanation = await getMathExplanation(topic, question, language);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain route error:", error);
    return NextResponse.json(
      { error: "Unable to generate explanation right now." },
      { status: 500 },
    );
  }
}
