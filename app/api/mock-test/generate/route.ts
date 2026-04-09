import { NextResponse } from "next/server";
import { generateMixedMockQuestions } from "@/lib/nvidia";
import { normalizeSeed } from "@/lib/mockSession";

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

    const collected = [] as Awaited<ReturnType<typeof generateMixedMockQuestions>>;
    const seen = new Set<string>(
      blockedQuestionSignatures.map((value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()),
    );

    for (let attempt = 0; attempt < 3 && collected.length < count; attempt += 1) {
      const pending = count - collected.length;
      const generated = await generateMixedMockQuestions({
        count: pending,
        language,
        variationSeed: `${variationSeed ?? Date.now()}-${attempt + 1}`,
        blockedQuestionSignatures: Array.from(seen),
      });

      for (const question of generated) {
        const signature = question.question.toLowerCase().replace(/\s+/g, " ").trim();
        if (seen.has(signature)) {
          continue;
        }

        seen.add(signature);
        collected.push(question);

        if (collected.length >= count) {
          break;
        }
      }
    }

    if (collected.length < count) {
      return NextResponse.json(
        {
          error: "Unable to generate enough unique LLM mock questions right now.",
          generatedCount: collected.length,
          requiredCount: count,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ questions: collected, source: "llm" });
  } catch (error) {
    console.error("Mock test route error:", error);
    return NextResponse.json({ error: "Unable to generate mock test right now." }, { status: 500 });
  }
}