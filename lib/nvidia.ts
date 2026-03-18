import type { Difficulty, TopicQuestion } from "@/lib/questionsData";

export async function getMathExplanation(topic: string, question: string, language: string = "Hindi") {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { 
            role: "system", 
            content: [
              `You are a helpful NavGurukul math mentor. Reply only in ${language}.`,
              "Keep the response short and practical.",
              "Do not give long concept theory.",
              "Do not ask new questions.",
              "Use this exact format:",
              "Step 1: ...",
              "Step 2: ...",
              "Step 3: ...",
              "Answer: ...",
              "Each step must be one short sentence.",
            ].join(" ")
          },
          { 
            role: "user", 
            content: `Topic: ${topic}\nQuestion: ${question}\nSolve this exact question only.`
          }
        ],
        temperature: 0.1,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`NVIDIA API request failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "I could not generate an explanation right now.";
    return raw
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (error) {
    console.error("NVIDIA API Error:", error);
    return "Sorry, I couldn't generate an explanation right now.";
  }
}

type GenerateQuestionParams = {
  topic: string;
  difficulty: Difficulty;
  count: number;
  language?: string;
};

function extractJsonObject(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

function normalizeGeneratedQuestions(
  questions: unknown,
  topic: string,
  difficulty: Difficulty,
  count: number,
): TopicQuestion[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  const normalized: TopicQuestion[] = [];

  for (const [index, item] of questions.entries()) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";
    const answerIndex = typeof record.answerIndex === "number" ? record.answerIndex : -1;
    const options = Array.isArray(record.options)
      ? record.options.filter((value): value is string => typeof value === "string").map((value) => value.trim())
      : [];

    if (!question || !explanation || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      continue;
    }

    normalized.push({
      id: `llm-${topic}-${difficulty}-${Date.now()}-${index}`,
      difficulty,
      question,
      options: [options[0], options[1], options[2], options[3]],
      answerIndex,
      explanation,
    });

    if (normalized.length >= count) {
      break;
    }
  }

  return normalized;
}

export async function generateMathQuestions({
  topic,
  difficulty,
  count,
  language = "English",
}: GenerateQuestionParams): Promise<TopicQuestion[]> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  const safeCount = Math.min(Math.max(count, 1), 25);

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: [
            "You generate interview-style math MCQs.",
            "Return JSON only. No markdown, no extra text.",
            "Schema:",
            '{"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}',
            "Rules: exactly 4 options, exactly one correct answer, answerIndex in [0,3], short explanation.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Generate ${safeCount} unique ${difficulty} questions for topic: ${topic}.`,
            `Language: ${language}.`,
            "Keep questions practical for NavGurukul math interview prep.",
          ].join("\n"),
        },
      ],
      temperature: 0.6,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`NVIDIA API request failed: ${response.status} ${errorBody}`);
  } 
  const data = await response.json();
  const raw = String(data?.choices?.[0]?.message?.content ?? "");
  const jsonBlock = extractJsonObject(raw);

  if (!jsonBlock) {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonBlock) as { questions?: unknown };
    return normalizeGeneratedQuestions(parsed.questions, topic, difficulty, safeCount);
  } catch {
    return [];
  }
}