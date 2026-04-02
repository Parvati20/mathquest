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
              "Explain in a clear, student-friendly paragraph.",
              "Use the provided base explanation as the source of truth.",
              "Do not invent a new method or different numeric result.",
              "Do not ask new questions.",
              "The final answer MUST match the provided correct answer exactly.",
              "Do not output any answer different from the provided correct answer.",
            ].join(" ")
          },
          { 
            role: "user", 
            content: [
              `Topic: ${topic}`,
              `Question: ${question}`,
              `Options: ${options.join(" | ")}`,
              `Correct Answer (must use exactly): ${correctAnswer}`,
              `Base Explanation (source of truth): ${baseExplanation}`,
              "Rewrite this base explanation in 4-6 simple readable sentences and end with: Final Answer: <correct answer>",
            ].join("\n")
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
  return question.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
}

function normalizeTopicKey(topic: string) {
  const value = topic.trim().toLowerCase();

  if (value.includes("number") && value.includes("pattern")) {
    return "number-patterns";
  }
  if (value.includes("percent")) {
    return "percentage";
  }
  if (value.includes("profit") || value.includes("loss")) {
    return "profit-loss";
  }
  if (value.includes("interest")) {
    return "simple-interest";
  }
  if (value.includes("work") || value.includes("time")) {
    return "work-time";
  }
  if (value.includes("linear") || value.includes("equation")) {
    return "linear-equations";
  }

  return value;
}

function getTopicSpecificGuidelines(topic: string, difficulty: Difficulty) {
  const topicKey = normalizeTopicKey(topic);

  const topicGuidelines: Record<string, string> = {
    "number-patterns": [
      "Focus on non-trivial progression logic: alternating rules, second-difference, multiplicative shifts, mixed operations.",
      "At medium/hard levels, avoid plain +2/+3 monotonic patterns unless wrapped in deeper logic.",
      "Include missing-term and reverse-pattern formats.",
    ].join("\n"),
    percentage: [
      "Use realistic word problems: price revision, marks, salary revision, reverse percentage.",
      "At hard level, include reverse setup where final value is given and original must be inferred.",
      "Avoid only direct 'x% of y' style when difficulty is medium/hard.",
    ].join("\n"),
    "profit-loss": [
      "Prefer practical commerce scenarios with CP/SP/MP, discount interactions, and actual profit% derivation.",
      "At hard level, combine at least two business operations (markup + discount or discount + target margin).",
      "Avoid one-line direct subtraction problems for medium/hard.",
    ].join("\n"),
    "simple-interest": [
      "Use SI, principal, rate, time in both forward and reverse forms.",
      "At medium/hard levels, include reverse reasoning (find P or R from amount/SI constraints).",
      "Prefer concise word problems instead of only formula substitution.",
    ].join("\n"),
    "work-time": [
      "Use efficiency/rate logic and combined work equations in word scenarios.",
      "At hard level, include three-person combinations, partial completion, or reverse efficiency deduction.",
      "Avoid only direct 1-day-work conversion at medium/hard.",
    ].join("\n"),
    "linear-equations": [
      "Blend algebraic and word-based system setups.",
      "At medium/hard levels, include two-condition reasoning (sum-difference, age, relation-based equations).",
      "Avoid only single-step forms like x+5=15 at medium/hard.",
    ].join("\n"),
  };

  const strictness = difficulty === "hard"
    ? "For HARD: every question must require multi-step reasoning; no trivial direct-substitution items."
    : difficulty === "medium"
      ? "For MEDIUM: at least one reasoning step beyond direct substitution in each question."
      : "For EASY: keep exam tone and avoid child-level toy phrasing.";

  return [topicGuidelines[topicKey] ?? "Create topic-faithful questions with varied structures.", strictness].join("\n");
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
      ? record.options.filter((value): value is string => typeof value === "string").map((value) => value.trim())
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

function getDifficultyGuidelines(difficulty: Difficulty): string {
  const guidelines: Record<Difficulty, string> = {
    easy: `EASY Level Requirements:
- Still exam-style, not child-level
- One short step or one direct calculation, but phrased like a real test question
- Use realistic classroom or shop examples, not toy examples
- Prefer small to medium numbers, but avoid absurdly obvious patterns
- Examples for Number Pattern: "2, 4, 8, 16, ?" or "3, 6, 12, 24, ?"
- Examples for Percentage: "What is 20% of 500?" or "10% of a number is 50, find the number"
- Examples for Profit/Loss: "Bought for 200 and sold for 240, what is the profit?"
- Keep it short, but not childish
- Answer should be findable in under 1 minute`,
    
    medium: `MEDIUM Level Requirements:
- Word-based problems with 1-2 steps of reasoning
- Moderate complexity (need to interpret and calculate)
- Mixed number ranges (some larger numbers allowed)
- Examples for Number Pattern: "Find next: 3,7,15,31,?" (requires pattern recognition) or "Find missing: 5,10,?,40,80"
- Examples for Percentage: "Student scores 80/100, find percentage" or "Price ₹400→₹500, find increase %"
- Examples for Profit/Loss: "Buy ₹500, sell ₹650, find profit%?" (requires multi-step)
- Small word problems (1-2 sentences)
- Answer should be findable in 2-3 minutes`,
    
    hard: `HARD Level Requirements:
  - Complex multi-step word problems with reverse or indirect reasoning
  - Real-world scenarios requiring logical thinking
  - Use larger numbers, mixed operations, and non-obvious setups
  - Avoid routine school-book templates; make each question feel fresh
  - Examples for Number Pattern: "1, 4, 9, 16, 25, ?" or "2, 3, 6, 15, 42, ?"
  - Examples for Percentage: "A value becomes 250 after a 25% increase, find the original"
  - Examples for Profit/Loss: "Bought ₹1000, sold ₹1200, discount applied, actual profit%?"
  - Examples for Simple Interest: "A sum becomes ₹3000 in 2 years at 10%, find principal"
  - Examples for Time & Work: "A does 40% of work in 4 days, find total time"
  - Multi-sentence word problems requiring deeper analysis
  - Answer should be findable in 4-5 minutes with careful calculation`
  };
  
  return guidelines[difficulty];
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

  const safeCount = Math.min(Math.max(count, 1), 25);
  const difficultyGuidelines = getDifficultyGuidelines(difficulty);
  const topicSpecificGuidelines = getTopicSpecificGuidelines(topic, difficulty);
  const seedHash = Math.abs(parseInt(String(variationSeed ?? Date.now()).slice(-6), 10));
  const variationModifier = seedHash % 8;
  const blockedSignatures = new Set(
    blockedQuestionSignatures
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  const systemPrompt = [
    "You are an expert math tutor for graduation and 12th-pass practice prep.",
    "Generate UNIQUE, HIGH-QUALITY questions that feel like a real exam.",
    "Return ONLY valid JSON. No markdown, no extra text, no backticks.",
    'JSON Schema: {"questions":[{"question":"...","options":["A)...","B)...","C)...","D)..."],"answerIndex":0,"explanation":"..."}]}',
    "CRITICAL RULES:",
    "1. Exactly 4 options, all plausible but only ONE correct",
    "2. answerIndex: 0-3 (correct answer position, vary it across questions)",
    "3. Each question MUST be completely unique - no copied/similar questions",
    "4. Options must use format: 'A) ...', 'B) ...', 'C) ...', 'D) ...'",
    "5. Short explanations (2-3 sentences max)",
    "6. NO questions you've generated before - be creative with numbers and scenarios",
    "7. Ensure difficulty matches specifications below",
    "8. Avoid childish or overly easy patterns; make questions exam-appropriate",
    "9. Keep the question style varied across the batch; do not reuse the same template",
    "10. If difficulty is medium or hard, do not generate primary-school direct arithmetic questions",
  ].join("\n");

  const userPrompt = [
    `Topic: ${topic}`,
    `Difficulty: ${difficulty.toUpperCase()}`,
    `Language: ${language}`,
    `Request ID: ${seedHash} (ensures variation across requests)`,
    "",
    "DIFFICULTY SPECIFICATIONS:",
    difficultyGuidelines,
    "",
    "TOPIC-SPECIFIC SPECIFICATIONS:",
    topicSpecificGuidelines,
    blockedSignatures.size > 0
      ? `Avoid producing questions that match these previously used signatures: ${Array.from(blockedSignatures).slice(0, 80).join(" | ")}`
      : "Avoid repeating prior textbook templates and keep all questions structurally fresh.",
    "",
    `Generate exactly ${safeCount} questions following the above difficulty level.`,
    "Make questions creative and avoid repetition from typical textbook examples.",
    "Use REALISTIC numbers and scenarios.",
    "Ensure answer choices are properly differentiated (wrong options should be plausible mistakes, not absurd).",
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
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.82 + (variationModifier * 0.02),
      max_tokens: 2200,
      top_p: 0.9,
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
    return normalizeGeneratedQuestions(parsed.questions, topic, difficulty, safeCount, blockedSignatures);
  } catch {
    return [];
  }
}

type GenerateMockQuestionsParams = {
  count: number;
  language?: string;
  variationSeed?: number | string;
};

function normalizeMockGeneratedQuestions(questions: unknown, count: number): MockQuestion[] {
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
      ? record.options.filter((value): value is string => typeof value === "string").map((value) => value.trim())
      : [];

    if (!allowedTopics.has(topic) || !question || !explanation || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      continue;
    }

    const signature = normalizeQuestionSignature(question);
    if (seenSignatures.has(signature)) {
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
}: GenerateMockQuestionsParams): Promise<MockQuestion[]> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing NVIDIA_API_KEY environment variable.");
  }

  const safeCount = Math.min(Math.max(count, 1), 20);
  const seedHash = Math.abs(parseInt(String(variationSeed ?? Date.now()).slice(-6), 10));
  const requestId = seedHash % 100000;

  const systemPrompt = [
    "You are an expert math tutor writing a mixed mock test for graduation and 12th-pass practice.",
    `Reply only in ${language}.`,
    "Return only valid JSON with no markdown or extra text.",
    'JSON Schema: {"questions":[{"topic":"...","topicTitle":"...","difficulty":"medium|hard","question":"...","options":["A)...","B)...","C)...","D)..."],"answerIndex":0,"explanation":"..."}]}',
    "Every question must be unique, exam-like, and clearly different from the others in the batch.",
    "Do not generate child-level or toy questions.",
    "Use varied structures: reverse reasoning, multi-step calculations, and realistic word problems.",
    "Avoid repeating the same question template with only number changes.",
    "All options must be plausible.",
  ].join(" ");

  const userPrompt = [
    "Generate exactly 20 mixed mock-test questions.",
    `Request ID: ${requestId}`,
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
      temperature: 0.88 + ((seedHash % 5) * 0.02),
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
    return normalizeMockGeneratedQuestions(parsed.questions, safeCount);
  } catch {
    return [];
  }
}