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
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Topic: ${topic}`,
              `Question: ${question}`,
              `Correct Answer (must use exactly): ${correctAnswer}`,
              `Base Explanation (source of truth): ${baseExplanation}`,
              "Rewrite in 2-4 short lines and end with: Final Answer: <correct answer>",
            ].join("\n"),
          },
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

type GeneratedQuestionTranslation = {
  question: string;
  options: [string, string, string, string];
  explanation: string;
};

function extractJsonCandidates(raw: string) {
  const candidates: string[] = [];
  const fenceMatches = raw.match(/```(?:json)?\s*([\s\S]*?)```/gi);

  if (fenceMatches) {
    for (const match of fenceMatches) {
      const contentMatch = match.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const content = contentMatch?.[1]?.trim();
      if (content) {
        candidates.push(content);
      }
    }
  }

  candidates.push(raw.trim());

  return candidates.filter(Boolean);
}

function findBalancedJsonSegment(raw: string, openChar: "{" | "[", closeChar: "}" | "]") {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let startIndex = -1;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      if (depth === 0) {
        startIndex = index;
      }
      depth += 1;
      continue;
    }

    if (char === closeChar && depth > 0) {
      depth -= 1;
      if (depth === 0 && startIndex !== -1) {
        return raw.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function normalizeQuestionSignature(question: string) {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeOptionSignature(option: string) {
  return option
    .replace(/^[A-Da-d][\).:-]?\s*/, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stripOptionPrefix(option: string) {
  return option.replace(/^[A-Da-d][\).:-]?\s*/, "").trim();
}

function parseOptionNumber(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumericOption(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return Number(value.toFixed(2)).toString();
}

function detectNextPatternAnswer(question: string) {
  const lower = question.toLowerCase();
  const isPatternPrompt =
    lower.includes("next number") ||
    lower.includes("next term") ||
    lower.includes("pattern") ||
    lower.includes("sequence") ||
    lower.includes("अगली") ||
    lower.includes("पुढ") ||
    lower.includes("क्रम");

  if (!isPatternPrompt) {
    return null;
  }

  const values = (question.match(/-?\d+(?:\.\d+)?/g) ?? []).map((value) => Number(value));
  const numbers = values.filter((value) => Number.isFinite(value));

  if (numbers.length < 3) {
    return null;
  }

  const diffs = numbers.slice(1).map((value, index) => value - numbers[index]);
  const firstDiff = diffs[0];
  if (diffs.every((diff) => Math.abs(diff - firstDiff) < 1e-9)) {
    return numbers[numbers.length - 1] + firstDiff;
  }

  if (numbers.every((value) => Math.abs(value) > 1e-9)) {
    const ratios = numbers.slice(1).map((value, index) => value / numbers[index]);
    const firstRatio = ratios[0];
    if (Number.isFinite(firstRatio) && ratios.every((ratio) => Math.abs(ratio - firstRatio) < 1e-9)) {
      return numbers[numbers.length - 1] * firstRatio;
    }
  }

  if (diffs.length >= 2) {
    const secondDiffs = diffs.slice(1).map((value, index) => value - diffs[index]);
    const firstSecondDiff = secondDiffs[0];
    if (secondDiffs.every((diff) => Math.abs(diff - firstSecondDiff) < 1e-9)) {
      const nextDiff = diffs[diffs.length - 1] + firstSecondDiff;
      return numbers[numbers.length - 1] + nextDiff;
    }
  }

  return null;
}

function enforcePatternAnswerConsistency(options: [string, string, string, string], answerIndex: number, question: string) {
  const computedAnswer = detectNextPatternAnswer(question);
  if (computedAnswer === null) {
    return { options, answerIndex };
  }

  const parsedOptions = options.map((option) => parseOptionNumber(option));
  let correctedIndex = parsedOptions.findIndex(
    (value) => value !== null && Math.abs((value as number) - computedAnswer) < 1e-9,
  );

  const updatedOptions = [...options] as [string, string, string, string];

  if (correctedIndex === -1) {
    const replacementIndex = 3;
    updatedOptions[replacementIndex] = formatNumericOption(computedAnswer);
    correctedIndex = replacementIndex;
  }

  return { options: updatedOptions, answerIndex: correctedIndex };
}

function matchesSelectedLanguage(text: string, language: "English" | "Hindi" | "Marathi") {
  const latinLetters = (text.match(/[A-Za-z]/g) ?? []).length;
  const devanagariLetters = (text.match(/[\u0900-\u097F]/g) ?? []).length;

  if (language === "English") {
    return latinLetters >= devanagariLetters;
  }

  // Hindi/Marathi both use Devanagari; reject mixed English text.
  return devanagariLetters > 0 && latinLetters === 0;
}

function normalizeQuestionTranslation(
  rawTranslation: unknown,
  fallbackQuestion: string,
  fallbackExplanation: string,
  fallbackOptions: [string, string, string, string],
) {
  if (!rawTranslation || typeof rawTranslation !== "object") {
    return undefined;
  }

  const record = rawTranslation as Record<string, unknown>;
  const question = typeof record.question === "string" ? record.question.trim() : "";
  const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";
  const options = Array.isArray(record.options)
    ? record.options.filter((value): value is string => typeof value === "string").map((value: string) => value.trim())
    : [];

  if (!question && !explanation) {
    return undefined;
  }

  return {
    question: question || fallbackQuestion,
    options:
      options.length === 4
        ? [options[0], options[1], options[2], options[3]] as [string, string, string, string]
        : fallbackOptions,
    explanation: explanation || fallbackExplanation,
  };
}

function normalizeGeneratedQuestions(
  questions: unknown,
  topic: string,
  difficulty: Difficulty,
  count: number,
  blockedSignatures: Set<string>,
  language: "English" | "Hindi" | "Marathi",
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
    let answerIndex = typeof record.answerIndex === "number" ? record.answerIndex : -1;
    const options = Array.isArray(record.options)
      ? record.options
          .filter((value): value is string => typeof value === "string")
          .map((value: string) => stripOptionPrefix(value.trim()))
      : [];

    const consistency =
      options.length === 4
        ? enforcePatternAnswerConsistency([options[0], options[1], options[2], options[3]], answerIndex, question)
        : null;

    const safeOptions = consistency ? consistency.options : ([options[0], options[1], options[2], options[3]] as [string, string, string, string]);
    if (consistency) {
      answerIndex = consistency.answerIndex;
    }
    const translationsRecord = record.translations && typeof record.translations === "object"
      ? (record.translations as Record<string, unknown>)
      : null;
    const translations = translationsRecord
      ? {
          English: normalizeQuestionTranslation(translationsRecord.English, question, explanation, safeOptions),
          Hindi: normalizeQuestionTranslation(translationsRecord.Hindi, question, explanation, safeOptions),
          Marathi: normalizeQuestionTranslation(translationsRecord.Marathi, question, explanation, safeOptions),
        }
      : undefined;

    if (!question || !explanation || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      continue;
    }

    if (!matchesSelectedLanguage(question, language)) {
      continue;
    }

    if (!matchesSelectedLanguage(explanation, language)) {
      continue;
    }

    const normalizedOptionSet = new Set(safeOptions.map((option) => normalizeOptionSignature(option)));
    if (normalizedOptionSet.size !== 4 || Array.from(normalizedOptionSet).some((option) => option.length === 0)) {
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
      options: safeOptions,
      answerIndex,
      explanation,
      translations,
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
  timeoutMs?: number;
}): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), prompt.timeoutMs ?? 45000);

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${prompt.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseNvidiaQuestionBlock(raw: string) {
  for (const candidate of extractJsonCandidates(raw)) {
    const directCandidates = [
      candidate,
      findBalancedJsonSegment(candidate, "{", "}"),
      findBalancedJsonSegment(candidate, "[", "]"),
    ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    for (const directCandidate of directCandidates) {
      try {
        const parsed = JSON.parse(directCandidate.trim()) as unknown;

        if (Array.isArray(parsed)) {
          return { questions: parsed };
        }

        if (parsed && typeof parsed === "object") {
          const record = parsed as { questions?: unknown };
          if (Array.isArray(record.questions)) {
            return record;
          }
        }
      } catch {
        // Keep trying the next candidate.
      }
    }
  }

  return null;
}

function parseNvidiaTranslationBlock(raw: string) {
  for (const candidate of extractJsonCandidates(raw)) {
    const directCandidates = [
      candidate,
      findBalancedJsonSegment(candidate, "{", "}"),
      findBalancedJsonSegment(candidate, "[", "]"),
    ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    for (const directCandidate of directCandidates) {
      try {
        const parsed = JSON.parse(directCandidate.trim()) as unknown;

        if (Array.isArray(parsed)) {
          return { translations: parsed };
        }

        if (parsed && typeof parsed === "object") {
          const record = parsed as { translations?: unknown };
          if (Array.isArray(record.translations)) {
            return record;
          }
        }
      } catch {
        // Keep trying candidates.
      }
    }
  }

  return null;
}

function parseNvidiaVerificationBlock(raw: string) {
  for (const candidate of extractJsonCandidates(raw)) {
    const directCandidates = [
      candidate,
      findBalancedJsonSegment(candidate, "{", "}"),
      findBalancedJsonSegment(candidate, "[", "]"),
    ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    for (const directCandidate of directCandidates) {
      try {
        const parsed = JSON.parse(directCandidate.trim()) as unknown;

        if (Array.isArray(parsed)) {
          return { checks: parsed };
        }

        if (parsed && typeof parsed === "object") {
          const record = parsed as { checks?: unknown; results?: unknown };
          if (Array.isArray(record.checks)) {
            return { checks: record.checks };
          }
          if (Array.isArray(record.results)) {
            return { checks: record.results };
          }
        }
      } catch {
        // Keep trying candidates.
      }
    }
  }

  return null;
}

async function verifyQuestionChunkAccuracy(
  chunk: TopicQuestion[],
  apiKey: string,
  language: "English" | "Hindi" | "Marathi",
): Promise<TopicQuestion[]> {
  if (chunk.length === 0) {
    return chunk;
  }

  const systemPrompt = [
    "You are a strict math MCQ validator.",
    "Solve each question and correct answerIndex if needed.",
    "If no option matches the true answer, replace exactly one option with the correct value and set answerIndex accordingly.",
    "Keep question text unchanged.",
    `Keep explanation in ${language}.`,
    "Return valid JSON only. No markdown.",
    'Schema: {"checks":[{"options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}',
  ].join(" ");

  const payload = chunk.map((question) => ({
    question: question.question,
    options: question.options,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
  }));

  const userPrompt = [
    "Validate and correct each item.",
    "Keep array length and order exactly the same.",
    "Input JSON:",
    JSON.stringify(payload),
  ].join("\n");

  const raw = await requestNvidiaBatch({
    systemPrompt,
    userPrompt,
    apiKey,
    temperature: 0,
    max_tokens: 2600,
    top_p: 1,
    timeoutMs: 12000,
  });

  const parsed = parseNvidiaVerificationBlock(raw);
  const checks = parsed?.checks;

  if (!Array.isArray(checks)) {
    return chunk;
  }

  const corrected: TopicQuestion[] = chunk.map((original, index) => {
    const item = checks[index];
    if (!item || typeof item !== "object") {
      return original;
    }

    const record = item as Record<string, unknown>;
    const answerIndex = typeof record.answerIndex === "number" ? record.answerIndex : original.answerIndex;
    const optionsRaw = Array.isArray(record.options)
      ? record.options
          .filter((value): value is string => typeof value === "string")
          .map((value: string) => stripOptionPrefix(value.trim()))
      : original.options;
    const explanation =
      typeof record.explanation === "string" && record.explanation.trim().length > 0
        ? record.explanation.trim()
        : original.explanation;

    if (optionsRaw.length !== 4 || answerIndex < 0 || answerIndex > 3) {
      return original;
    }

    const optionSet = new Set(optionsRaw.map((option) => normalizeOptionSignature(option)));
    if (optionSet.size !== 4) {
      return original;
    }

    return {
      ...original,
      options: [optionsRaw[0], optionsRaw[1], optionsRaw[2], optionsRaw[3]] as [string, string, string, string],
      answerIndex,
      explanation,
    };
  });

  const auditSystemPrompt = [
    "You are an independent MCQ math auditor.",
    "Do not trust the provided answerIndex; solve each question independently.",
    "If the provided answerIndex is correct, mark isValid=true.",
    "If it is wrong but a correct option exists, set isValid=true and provide corrected answerIndex.",
    "If no option is mathematically correct, mark isValid=false.",
    "Return valid JSON only. No markdown.",
    'Schema: {"checks":[{"isValid":true,"answerIndex":0}]}',
  ].join(" ");

  const auditPrompt = [
    "Audit these questions.",
    "Keep array order and length same.",
    "Input JSON:",
    JSON.stringify(
      corrected.map((question) => ({
        question: question.question,
        options: question.options,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
      })),
    ),
  ].join("\n");

  try {
    const auditRaw = await requestNvidiaBatch({
      systemPrompt: auditSystemPrompt,
      userPrompt: auditPrompt,
      apiKey,
      temperature: 0,
      max_tokens: 1800,
      top_p: 1,
      timeoutMs: 9000,
    });

    const auditParsed = parseNvidiaVerificationBlock(auditRaw);
    const auditChecks = auditParsed?.checks;

    if (!Array.isArray(auditChecks)) {
      return corrected;
    }

    const validated: TopicQuestion[] = [];

    for (let index = 0; index < corrected.length; index += 1) {
      const current = corrected[index];
      const auditItem = auditChecks[index];

      if (!auditItem || typeof auditItem !== "object") {
        continue;
      }

      const auditRecord = auditItem as Record<string, unknown>;
      const isValid =
        auditRecord.isValid === true ||
        auditRecord.valid === true ||
        auditRecord.status === "valid";
      const correctedAnswerIndex =
        typeof auditRecord.answerIndex === "number" &&
        auditRecord.answerIndex >= 0 &&
        auditRecord.answerIndex <= 3
          ? auditRecord.answerIndex
          : current.answerIndex;

      if (!isValid) {
        continue;
      }

      validated.push({
        ...current,
        answerIndex: correctedAnswerIndex,
      });
    }

    return validated;
  } catch {
    return corrected;
  }
}

async function translateQuestionChunk(
  chunk: TopicQuestion[],
  targetLanguage: "Hindi" | "Marathi",
  apiKey: string,
): Promise<Array<GeneratedQuestionTranslation | null>> {
  const systemPrompt = [
    `You are a strict translation engine. Translate math MCQ text to ${targetLanguage}.`,
    "Keep all numbers, symbols, equations, and numeric values unchanged.",
    "Translate only natural language text in question/options/explanation.",
    "Return only valid JSON. No markdown.",
    'Schema: {"translations":[{"question":"...","options":["...","...","...","..."],"explanation":"..."}]}',
  ].join(" ");

  const sourcePayload = chunk.map((question) => ({
    question: question.question,
    options: question.options,
    explanation: question.explanation,
  }));

  const userPrompt = [
    `Translate all items to ${targetLanguage}.`,
    "Keep array length and order exactly the same.",
    "Input JSON:",
    JSON.stringify(sourcePayload),
  ].join("\n");

  const raw = await requestNvidiaBatch({
    systemPrompt,
    userPrompt,
    apiKey,
    temperature: 0,
    max_tokens: 2400,
    top_p: 1,
    timeoutMs: 16000,
  });

  const parsed = parseNvidiaTranslationBlock(raw);
  const translations = parsed?.translations;
  if (!Array.isArray(translations)) {
    return chunk.map(() => null);
  }

  return chunk.map((_, index) => {
    const item = translations[index];
    if (!item || typeof item !== "object") {
      return null;
    }

    const record = item as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const explanation = typeof record.explanation === "string" ? record.explanation.trim() : "";
    const options = Array.isArray(record.options)
      ? record.options.filter((value): value is string => typeof value === "string").map((value: string) => value.trim())
      : [];

    if (!question || !explanation || options.length !== 4) {
      return null;
    }

    return {
      question,
      options: [options[0], options[1], options[2], options[3]],
      explanation,
    };
  });
}

async function attachAutoTranslations(questions: TopicQuestion[], apiKey: string) {
  if (questions.length === 0) {
    return questions;
  }

  const chunkSize = 8;
  const translated = questions.map((question) => ({ ...question }));

  for (let start = 0; start < translated.length; start += chunkSize) {
    const chunk = translated.slice(start, start + chunkSize);

    let hindiChunk: Array<GeneratedQuestionTranslation | null> = chunk.map(() => null);
    let marathiChunk: Array<GeneratedQuestionTranslation | null> = chunk.map(() => null);

    try {
      hindiChunk = await translateQuestionChunk(chunk, "Hindi", apiKey);
    } catch {
      // Best effort; keep base text if translation fails.
    }

    try {
      marathiChunk = await translateQuestionChunk(chunk, "Marathi", apiKey);
    } catch {
      // Best effort; keep base text if translation fails.
    }

    for (let index = 0; index < chunk.length; index += 1) {
      const target = translated[start + index];
      const baseOptions = target.options;
      const baseExplanation = target.explanation;

      target.translations = {
        English: {
          question: target.question,
          options: baseOptions,
          explanation: baseExplanation,
        },
        Hindi: hindiChunk[index]
          ? {
              question: hindiChunk[index]!.question,
              options: hindiChunk[index]!.options,
              explanation: hindiChunk[index]!.explanation,
            }
          : undefined,
        Marathi: marathiChunk[index]
          ? {
              question: marathiChunk[index]!.question,
              options: marathiChunk[index]!.options,
              explanation: marathiChunk[index]!.explanation,
            }
          : undefined,
      };
    }
  }

  return translated;
}

async function repairNvidiaQuestionBlock(raw: string, apiKey: string, topic: string, difficulty: Difficulty, count: number) {
  const repairSystemPrompt = [
    "You are a strict JSON repair tool for math MCQs.",
    "Convert the provided content into valid JSON only.",
    "Preserve the question text, options, answerIndex, and explanation if they are present.",
    "Do not add markdown, commentary, or code fences.",
    'Return exactly this schema: {"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"...","translations":{"English":{"question":"...","options":["...","...","...","..."],"explanation":"..."},"Hindi":{"question":"...","options":["...","...","...","..."],"explanation":"..."},"Marathi":{"question":"...","options":["...","...","...","..."],"explanation":"..."}}]}',
  ].join(" ");

  const repairUserPrompt = [
    `Topic: ${topic}`,
    `Difficulty: ${difficulty}`,
    `Target question count: ${count}`,
    "Repair this output into valid JSON:",
    raw.slice(0, 12000),
  ].join("\n");

  try {
    const repairedRaw = await requestNvidiaBatch({
      systemPrompt: repairSystemPrompt,
      userPrompt: repairUserPrompt,
      apiKey,
      temperature: 0,
      max_tokens: 6000,
      top_p: 1,
      timeoutMs: 4000,
    });

    return parseNvidiaQuestionBlock(repairedRaw);
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
  const safeLanguage: "English" | "Hindi" | "Marathi" =
    language === "Hindi" || language === "Marathi" ? language : "English";
  const maxBatchSize = 4;
  const maxAttempts = Math.max(10, Math.ceil(safeCount / maxBatchSize) + 10);
  const totalBudgetMs = 120000;
  const startedAtMs = Date.now();
  const collected: TopicQuestion[] = [];
  const dynamicBlockedSignatures = new Set(blockedSignatures);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts && collected.length < safeCount; attempt += 1) {
    if (Date.now() - startedAtMs >= totalBudgetMs) {
      break;
    }

    const remaining = safeCount - collected.length;
    const batchCount = Math.min(maxBatchSize, remaining);
    const batchRequestId = `${requestId}-${attempt + 1}`;

    const systemPrompt = `You are a Math AI. Generate ${batchCount} UNIQUE MCQ questions for "${topic}" at "${difficulty}" level.
RULES:
1. Do not repeat these patterns: [${Array.from(dynamicBlockedSignatures).slice(-20).join(" | ")}].
2. Use fresh wording and fresh numbers.
3. Request ID for variation: ${batchRequestId}.
4. Output only valid JSON.
5. Write question, options, and explanation only in ${safeLanguage}.
5a. If language is Hindi or Marathi, do not use any English words in question/explanation/options.
5b. If the question involves money, use ₹ or Rs. and never use $.
6. Options A, B, C, D must all be different values.
7. Exactly one option must be correct, matching answerIndex.
  Schema: {"questions": [{"question": "...", "options": ["A)...","B)...","C)...","D)..."], "answerIndex": 0, "explanation": "..."}]}`;

    const userPrompt = `Generate exactly ${batchCount} fresh MCQ questions now for topic ${topic} at ${difficulty} level. Return valid JSON only. Use only ${safeLanguage}. If any question involves money, use ₹ or Rs. and never use $.`;

    let raw = "";

    try {
      raw = await requestNvidiaBatch({
        systemPrompt,
        userPrompt,
        apiKey,
        temperature: 0.95,
        max_tokens: 1400,
        top_p: 0.9,
        timeoutMs: 12000,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Question generation failed.");
      continue;
    }

    const parsed = parseNvidiaQuestionBlock(raw);
    const resolvedParsed = parsed ?? await repairNvidiaQuestionBlock(raw, apiKey, topic, difficulty, batchCount);
    if (!resolvedParsed) {
      lastError = new Error("NVIDIA response was not valid JSON.");
      continue;
    }

    const batchQuestions = normalizeGeneratedQuestions(
      resolvedParsed.questions,
      topic,
      difficulty,
      batchCount,
      dynamicBlockedSignatures,
      safeLanguage,
    );

    if (batchQuestions.length === 0) {
      lastError = new Error("NVIDIA response did not contain any valid questions.");
      continue;
    }

    let verifiedBatchQuestions = batchQuestions;
    try {
      verifiedBatchQuestions = await verifyQuestionChunkAccuracy(batchQuestions, apiKey, safeLanguage);
    } catch {
      // If verification fails, keep original generated batch.
    }

    for (const question of verifiedBatchQuestions) {
      const signature = normalizeQuestionSignature(question.question);
      dynamicBlockedSignatures.add(signature);
      collected.push(question);
      if (collected.length >= safeCount) {
        break;
      }
    }
  }

  if (collected.length === 0) {
    throw lastError ?? new Error("Question generation failed.");
  }

  if (collected.length < safeCount) {
    console.warn(`Returning partial question set: ${collected.length}/${safeCount}`);
  }

  return attachAutoTranslations(collected, apiKey);
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
  const parsed = parseNvidiaQuestionBlock(raw);

  if (!parsed) {
    return [];
  }

  try {
    return normalizeMockGeneratedQuestions(parsed.questions, safeCount, blockedSignatures);
  } catch {
    return [];
  }
}

