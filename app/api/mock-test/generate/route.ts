import { NextResponse } from "next/server";
import { generateMixedMockQuestions } from "@/lib/nvidia";
import {
  buildMockFallbackSession,
  mergeMockQuestions,
  normalizeSeed,
} from "@/lib/mockSession";

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

    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "English";
    const blockedQuestionSignatures = Array.isArray(body.blockedQuestionSignatures)
      ? body.blockedQuestionSignatures
          .filter((value: unknown): value is string => typeof value === "string")
          .map((value: string) => value.trim())
          .filter(Boolean)
          .slice(0, 400)
      : [];
    const variationSeed = normalizeSeed(
      typeof body.variationSeed === "number" || typeof body.variationSeed === "string"
        ? body.variationSeed
        : undefined,
    );
    const count = 20;

    try {
      const generated = await generateMixedMockQuestions({
        count,
        language,
        variationSeed,
        blockedQuestionSignatures,
      });

      const merged = mergeMockQuestions(generated, variationSeed, count, blockedQuestionSignatures);
      const source = generated.length === 0 ? "bank" : merged.length > generated.length ? "mixed" : "llm";

      return NextResponse.json({ questions: merged, source });
    } catch (error) {
      console.error("Mock test generation error:", error);
      return NextResponse.json({
        questions: buildMockFallbackSession(variationSeed, count, blockedQuestionSignatures),
        source: "bank",
      });
    }
  } catch (error) {
    console.error("Mock test route error:", error);
    return NextResponse.json({ error: "Unable to generate mock test right now." }, { status: 500 });
  }
}