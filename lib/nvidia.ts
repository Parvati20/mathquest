import { getMockTopicTitle, type MockQuestion } from "@/lib/mockSession";
import type { Difficulty, TopicQuestion } from "@/lib/questionsData";

export async function getMathExplanation(
  topic: string,
  question: string,
  options: string[],
  correctAnswer: string,
  baseExplanation: string,
  language: string = "Hindi",
) {
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
              "Keep the explanation concise, accurate, and student-friendly.",
              "Use baseExplanation as source of truth and keep final numeric answer exactly same.",
            ].join(" ")
          },
          { 
            role: "user", 
            content: [
              `Topic: ${topic}`,
              `Question: ${question}`,
              `Correct Answer (must use exactly): ${correctAnswer}`,
              `Base Explanation (source of truth): ${baseExplanation}`,
              "Rewrite in 2-4 short lines and end with: Final Answer: <correct answer>",
            ].join("\n")
          }
        ],
        temperature: 0,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`NVIDIA API request failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "I could not generate an explanation right now.";
    const cleaned = raw
      .replace(/(?:Final\s*Answer|Answer)\s*:\s*.*/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return `${cleaned}\nFinal Answer: ${correctAnswer}`;
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
  variationSeed?: number | string;
  blockedQuestionSignatures?: string[];
};

function extractJsonObject(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return raw.slice(start, end + 1);
}

function normalizeQuestionSignature(question: string) {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeGeneratedQuestions(
  questions: unknown,
  topic: string,
  difficulty: Difficulty,
  count: number,
  blockedSignatures: Set<string>,
): TopicQuestion[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  const normalized: TopicQuestion[] = [];
  const seenSignatures = new Set<string>();

  for (const [index, item] of questions.entries()) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";
    const answerIndex = typeof record.answerIndex === "number" ? record.answerIndex : -1;
    const options = Array.isArray(record.options)
      ? record.options.filter((value): value is string => typeof value === "string").map((value: string) => value.trim())
      : [];

    if (!question || !explanation || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      continue;
    }

    const signature = normalizeQuestionSignature(question);
    if (seenSignatures.has(signature) || blockedSignatures.has(signature)) {
      continue;
    }

    seenSignatures.add(signature);

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

function buildBlockedPatternLine(blockedQuestionSignatures: string[]) {
  const recent = blockedQuestionSignatures.slice(-10).filter(Boolean);

  if (recent.length === 0) {
    return "None";
  }

  return recent.join(" | ");
}

async function requestNvidiaBatch(prompt: {
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}): Promise<string> {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${prompt.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt },
      ],
      temperature: prompt.temperature,
      max_tokens: prompt.max_tokens,
      top_p: prompt.top_p,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`NVIDIA API request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

function parseNvidiaQuestionBlock(raw: string) {
  const jsonBlock = extractJsonObject(raw);

  if (!jsonBlock) {
    return null;
  }

  try {
    return JSON.parse(jsonBlock) as { questions?: unknown };
  } catch {
    return null;
  }
}

export async function generateMathQuestions({
  topic,
  difficulty,
  count,
  language = "English",
  variationSeed,
  blockedQuestionSignatures = [],
}: GenerateQuestionParams): Promise<TopicQuestion[]> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  const blockedSignatures = new Set(
    blockedQuestionSignatures
      .filter((value): value is string => typeof value === "string")
      .map((value: string) => value.trim())
      .filter(Boolean),
  );
  const requestId = Math.abs(parseInt(String(variationSeed ?? Date.now()).slice(-6), 10));

  const safeCount = Math.min(Math.max(count, 1), 25);
  const systemPrompt = `You are a Math AI. Generate ${safeCount} UNIQUE MCQ questions for "${topic}" at "${difficulty}" level.
Language: ${language}.
RULES:
1. DO NOT repeat these patterns: [${blockedQuestionSignatures.slice(-10).join(" | ")}].
2. Use random numbers (e.g. ${Math.floor(Math.random() * 90 + 10)}).
3. Request ID for variation: ${requestId}.
4. Output ONLY valid JSON.
Schema: {"questions": [{"question": "...", "options": ["A)...","B)...","C)...","D)..."], "answerIndex": 0, "explanation": "..."}]}`;

  const userPrompt = `Generate ${safeCount} fresh MCQ questions now for topic ${topic} at ${difficulty} level. Return valid JSON only.`;

  let raw = "";

  try {
    raw = await requestNvidiaBatch({
      systemPrompt,
      userPrompt,
      apiKey,
      temperature: 0.95,
      max_tokens: 1500,
      top_p: 0.9,
    });
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }

  const parsed = parseNvidiaQuestionBlock(raw);
  if (!parsed) {
    return [];
  }

  const questions = normalizeGeneratedQuestions(parsed.questions, topic, difficulty, safeCount, blockedSignatures);
  return questions;
}

type GenerateMockQuestionsParams = {
  count: number;
  language?: string;
  variationSeed?: number | string;
  blockedQuestionSignatures?: string[];
};

function normalizeMockGeneratedQuestions(
  questions: unknown,
  count: number,
  blockedSignatures: Set<string>,
): MockQuestion[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  const allowedTopics = new Set([
    "number-patterns",
    "percentage",
    "profit-loss",
    "simple-interest",
    "work-time",
    "linear-equations",
  ]);
  const normalized: MockQuestion[] = [];
  const seenSignatures = new Set<string>();

  for (const [index, item] of questions.entries()) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const topic = typeof record.topic === "string" ? record.topic.trim() : "";
    const difficulty = record.difficulty === "easy" || record.difficulty === "medium" || record.difficulty === "hard"
      ? record.difficulty
      : "hard";
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";
    const answerIndex = typeof record.answerIndex === "number" ? record.answerIndex : -1;
    const options = Array.isArray(record.options)
      ? record.options.filter((value): value is string => typeof value === "string").map((value: string) => value.trim())
      : [];

    if (!allowedTopics.has(topic) || !question || !explanation || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      continue;
    }

    const signature = normalizeQuestionSignature(question);
    if (seenSignatures.has(signature) || blockedSignatures.has(signature)) {
      continue;
    }

    seenSignatures.add(signature);
    normalized.push({
      id: `mock-${topic}-${Date.now()}-${index}`,
      topic,
      topicTitle: typeof record.topicTitle === "string" && record.topicTitle.trim() ? record.topicTitle.trim() : getMockTopicTitle(topic),
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

export async function generateMixedMockQuestions({
  count,
  language = "English",
  variationSeed,
  blockedQuestionSignatures = [],
}: GenerateMockQuestionsParams): Promise<MockQuestion[]> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  const safeCount = Math.min(Math.max(count, 1), 20);
  const seedHash = Math.abs(parseInt(String(variationSeed ?? Date.now()).slice(-6), 10));
  const requestId = seedHash % 100000;
  const blockedSignatures = new Set(
    blockedQuestionSignatures
      .filter((value): value is string => typeof value === "string")
      .map((value: string) => value.trim())
      .filter(Boolean),
  );

  const systemPrompt = [
    "You are a Math AI for NavGurukul mock tests.",
    `Reply only in ${language}.`,
    "Return only valid JSON and nothing else.",
    'Schema: {"questions":[{"topic":"...","topicTitle":"...","difficulty":"medium|hard","question":"...","options":["A)...","B)...","C)...","D)..."],"answerIndex":0,"explanation":"..."}]}',
    "Rules:",
    "1. Every question must be unique and exam-like.",
    "2. Use varied structures and realistic word problems.",
    "3. Do not repeat the same template with only number changes.",
    "4. All options must be plausible.",
  ].join(" ");

  const userPrompt = [
    `Generate exactly ${count} mixed mock-test questions.`,
    `Request ID: ${requestId}`,
    `Do not repeat these patterns: [${buildBlockedPatternLine(blockedQuestionSignatures)}].`,
    "Use these exact topic counts:",
    "- number-patterns: 4 questions (2 medium, 2 hard)",
    "- percentage: 4 questions (2 medium, 2 hard)",
    "- profit-loss: 3 questions (1 medium, 2 hard)",
    "- simple-interest: 3 questions (1 medium, 2 hard)",
    "- work-time: 3 questions (1 medium, 2 hard)",
    "- linear-equations: 3 questions (1 medium, 2 hard)",
    "Mix the topics in the final output instead of grouping them together.",
    "Keep the mock test challenging and exam-appropriate.",
    "Every question must include topic, topicTitle, difficulty, question, options, answerIndex, and explanation.",
    "Topic titles should be human-readable: Number Patterns, Percentage, Profit & Loss, Simple Interest, Work & Time, Linear Equations.",
  ].join("\n");

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.95,
      top_p: 0.92,
      max_tokens: 3200,
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
    return normalizeMockGeneratedQuestions(parsed.questions, safeCount, blockedSignatures);
  } catch {
    return [];
  }
}

