const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const QUESTION_GENERATION_BUDGET_MS = 20000;

import fs from "fs";
import path from "path";

export type GeneratedQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  answerIndex: number;
  explanation: string;
  difficulty: string;
  translations?: Record<
    string,
    {
      question: string;
      options: [string, string, string, string];
      explanation: string;
    }
  >;
};

function ensureNvidiaLogDir() {
  try {
    const dir = path.join(process.cwd(), ".nvidia-logs");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (e) {
    console.log("[nvidia logs] ensure dir failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

function dumpNvidiaDebug(filenamePrefix: string, content: string) {
  try {
    const dir = ensureNvidiaLogDir();
    if (!dir) return null;
    const name = `${Date.now()}-${filenamePrefix.replace(/[^a-z0-9-_\.]/gi, "_")}.log`;
    const file = path.join(dir, name);
    fs.appendFileSync(file, content, { encoding: "utf8" });
    console.log(`[nvidia logs] Wrote debug dump: ${file}`);
    return file;
  } catch {
    console.log("[nvidia logs] write failed");
    return null;
  }
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripEmbeddedOptions(text: string) {
  const normalized = normalizeWhitespace(text);
  const optionMarker = normalized.match(/\s(?:A|B|C|D)[\)\.:]\s*/i);

  if (!optionMarker || optionMarker.index === undefined || optionMarker.index <= 0) {
    return normalized;
  }

  return normalized.slice(0, optionMarker.index).trim();
}

function normalizeChoiceText(text: string) {
  const normalized = normalizeWhitespace(text);
  return normalized
    .replace(/^\(?[A-Da-d]\)?[\)\.:\-\u2013\u2014]\s*/, "")
    .replace(/^\(?\d+\)?[\)\.:\-\u2013\u2014]\s+/, "");
}

function normalizeQuestionSignature(text: string, topic?: string) {
  const normalized = normalizeWhitespace(text).toLowerCase();

  // For number-patterns, dedupe by numeric sequence so minor wording changes
  // (language stem variations) do not bypass uniqueness checks.
  if (topic === "number-patterns") {
    const nums = normalized.match(/\d+/g);
    if (nums && nums.length >= 3) {
      return `seq:${nums.join(",")}`;
    }
  }

  return normalized;
}

function promptQuestionSignature(text: string, topic?: string) {
  const signature = normalizeQuestionSignature(text, topic);

  if (signature.startsWith("seq:")) {
    return signature;
  }

  return signature.slice(0, 64);
}

function sanitizeGeneratedQuestionText(text: string) {
  const normalized = stripEmbeddedOptions(text);
  const optionPattern = /(?:^|\s)(?:A|B|C|D)[\)\.:]\s*/gi;
  const matches = Array.from(normalized.matchAll(optionPattern));

  if (matches.length > 0) {
    const firstMarker = matches[0];
    if (firstMarker.index !== undefined && firstMarker.index > 0) {
      return normalized.slice(0, firstMarker.index).trim();
    }
  }

  return normalized
    .replace(/\s*[A-D][\)\.:]\s*.*$/i, "")
    .replace(/\s*\d+[\)\.:]\s*.*$/i, "")
    .trim();
}

function cleanOptions(q: GeneratedQuestion) {
  const normalizedOptions = q.options.map((option) => normalizeChoiceText(String(option))).filter(Boolean);
  const correctIndex = Math.min(Math.max(q.answerIndex, 0), 3);
  const correctOption = normalizedOptions[correctIndex] ?? normalizedOptions[0] ?? "";
  const unique = Array.from(new Set(normalizedOptions)).filter(Boolean);

  if (!correctOption) {
    return q;
  }

  if (!unique.includes(correctOption)) {
    unique[0] = correctOption;
  }

  while (unique.length < 4) {
    unique.push(String(Math.floor(Math.random() * 50) + 1));
  }

  const shuffled = unique.slice(0, 4).sort(() => Math.random() - 0.5);

  return {
    ...q,
    options: shuffled as [string, string, string, string],
    answerIndex: shuffled.indexOf(correctOption),
  };
}

function fixNumberPatternAnswer(q: GeneratedQuestion) {
  try {
    const nums = q.question.match(/\d+/g)?.map(Number);
    if (!nums || nums.length < 3) return q;

    const diffs: number[] = [];
    for (let i = 1; i < nums.length; i++) {
      diffs.push(nums[i] - nums[i - 1]);
    }

    if (diffs.length < 2) return q;

    const step = diffs[1] - diffs[0];
    const nextDiff = diffs[diffs.length - 1] + step;
    const expected = nums[nums.length - 1] + nextDiff;

    const options = q.options.map((option) => Number(option));
    if (options.some((option) => Number.isNaN(option))) return q;

    if (!options.includes(expected)) {
      options[0] = expected;
    }

    const shuffled = options.slice(0, 4).sort(() => Math.random() - 0.5);

    return {
      ...q,
      options: shuffled.map(String) as [string, string, string, string],
      answerIndex: Math.max(shuffled.indexOf(expected), 0),
    };
  } catch {
    return q;
  }
}

function validateQuestion(q: GeneratedQuestion) {
  if (!q.question.trim()) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.answerIndex < 0 || q.answerIndex > 3) return false;

  const correct = q.options[q.answerIndex];
  if (!correct || correct.trim() === "") return false;

  return new Set(q.options.map((option) => normalizeChoiceText(String(option)))).size === 4;
}

function isValidNumberPattern(q: GeneratedQuestion) {
  const seqMatch = q.question.match(/(?:\d+\s*[,\s]\s*){2,}\d+/);
  if (!seqMatch) return false;

  const nums = q.question.match(/\d+/g)?.map(Number);
  if (!nums || nums.length < 3) return false;

  const diffs: number[] = [];
  for (let i = 1; i < nums.length; i++) {
    diffs.push(nums[i] - nums[i - 1]);
  }

  // Check if it's a constant arithmetic sequence (all diffs the same)
  const isConstant = diffs.every((d) => d === diffs[0]);
  if (isConstant) return true;

  // Also accept second-order arithmetic sequences (differences form arithmetic sequence)
  // E.g., 2, 6, 12, 20 has diffs [4, 6, 8] which have constant second-order diff [2, 2]
  if (diffs.length >= 2) {
    const secondDiffs: number[] = [];
    for (let i = 1; i < diffs.length; i++) {
      secondDiffs.push(diffs[i] - diffs[i - 1]);
    }
    const isSecondOrderArithmetic = secondDiffs.every((d) => d === secondDiffs[0]);
    if (isSecondOrderArithmetic && secondDiffs[0] !== 0) {
      return true;
    }
  }

  return false;
}

function isCorrectLanguage(text: string, language: string) {
  if (language === "Marathi" || language === "Hindi") {
    // Allow Devanagari + occasional Latin concept terms and math symbols used in explanations.
    return /^[\u0900-\u097F\u200C\u200DA-Za-z0-9\s,.\-?!:()+=%/*×]+$/.test(text);
  }

  if (language === "English") {
    // Allow letters, numbers, punctuation, and common math symbols.
    return /^[A-Za-z0-9\s,.\-?!:()+=%/*×]+$/.test(text);
  }

  return true;
}

async function callLLM(system: string, user: string, maxTokens = 800, temperature = 0.1) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY missing");
    return "";
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log("❌ GROQ ERROR:", err);
      return "";
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.log("❌ FETCH ERROR:", err instanceof Error ? err.message : err);
    return "";
  }
}

const parseQuestions = (raw: string) => {
  try {
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return [];
    }

    return parsed.questions;
  } catch {
    console.log("❌ JSON parse failed");
    return [];
  }
};

async function generateBatch(
  topic: string,
  difficulty: string,
  count: number,
  language: string,
  blockedQuestionSignatures: string[] = [],
  attempt = 1
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in environment");
    return [];
  }

  let exampleQuestion = "";
  let exampleExplanation = "";

  // Set topic-specific examples based on the topic parameter
  if (topic === "number-patterns") {
    if (language === "Hindi") {
      exampleQuestion = "अगली संख्या खोजो: 2, 6, 12, 20, ?";
      exampleExplanation = "यह quadratic pattern है क्योंकि क्रमांतर (4, 6, 8) खुद arithmetic sequence बना रहे हैं। अगला अंतर 10 होगा। इसलिए अगली संख्या = 20 + 10 = 30।";
    } else if (language === "Marathi") {
      exampleQuestion = "पुढील संख्या कोणती: 3, 6, 9, 12, ?";
      exampleExplanation = "यह arithmetic progression है कारण फरक 3, 3, 3 स्थिर है। पुढील संख्या = 12 + 3 = 15।";
    } else {
      exampleQuestion = "Find the next term in the sequence: 2, 6, 12, 20, ?";
      exampleExplanation = "This is a quadratic pattern where differences form an arithmetic sequence (4, 6, 8). Next difference = 10. So next term = 20 + 10 = 30.";
    }
  } else if (topic === "percentage") {
    if (language === "Hindi") {
      exampleQuestion = "150 का 20% क्या है?";
      exampleExplanation = "Percentage formula: (प्रतिशत/100) × संख्या। यहां: (20/100) × 150 = 0.20 × 150 = 30। यह percentage की basic concept है।";
    } else if (language === "Marathi") {
      exampleQuestion = "150 च्या 20% किती आहे?";
      exampleExplanation = "Percentage सूत्र: (प्रतिशत/100) × संख्या। येथे: (20/100) × 150 = 30। यह percentage calculation की concept है।";
    } else {
      exampleQuestion = "What is 20% of 150?";
      exampleExplanation = "Percentage formula: (percentage/100) × value. Here: (20/100) × 150 = 30. This teaches how to calculate percentage of any number.";
    }
  } else {
    // For all other topics, provide a generic fallback example
    if (language === "Hindi") {
      exampleQuestion = "एक सवाल का उदाहरण।";
      exampleExplanation = "यह एक उदाहरण स्पष्टीकरण है जो concept समझाता है।";
    } else if (language === "Marathi") {
      exampleQuestion = "एक प्रश्नाचे उदाहरण।";
      exampleExplanation = "हे एक उदाहरण स्पष्टीकरण आहे जे concept समजते।";
    } else {
      exampleQuestion = "Example question for this topic.";
      exampleExplanation = "This is an example explanation that teaches the underlying concept.";
    }
  }

  const blockedList = blockedQuestionSignatures.slice(0, 15);
  const blockedClause = blockedList.length
    ? `\nDO NOT REPEAT THESE QUESTION SIGNATURES:\n${blockedList.map((value) => `- ${promptQuestionSignature(value, topic)}`).join("\n")}`
    : "";

  // Build topic-specific examples with DO's and DON'Ts for conceptual learning
  let topicGuidance = "";
  if (topic === "number-patterns") {
    topicGuidance = `TOPIC: Number Patterns & Sequences
CONCEPTS TO MASTER:
- Arithmetic Progressions: constant difference between consecutive terms
- Geometric Progressions: constant ratio between consecutive terms  
- Quadratic/Compound Patterns: difference of differences changes
- Mixed Patterns: combination of different rules

EXAMPLE QUESTION (to understand concept, NOT to memorize format):
"पुढील संख्या कोणती: 2, 6, 12, 20, ?"
Explanation: यह quadratic pattern है - differences are 4, 6, 8 (अगला 10 होगा)। Answer: 30

DO's:
✓ Practice identifying CONCEPTS: Is difference constant? Is there a ratio? Are differences changing?
✓ Generate VARIOUS FORMATS of same concept
✓ Mix different pattern types in questions

DON'Ts:
✗ Do NOT memorize specific question formats
✗ Do NOT expect all questions to follow the exact example structure
✗ Do NOT assume you know which patterns will appear

GENERATION RULE: Create diverse questions using arithmetic, geometric, or compound patterns. Options must be 4 distinct numbers.`;
  } else if (topic === "percentage") {
    topicGuidance = `TOPIC: Percentage Calculations
CONCEPTS TO MASTER:
- Finding percentage of a number: (percentage/100) × number
- Finding what percentage one value is of another
- Percentage increase/decrease applications
- Real-world percentage problems

EXAMPLE QUESTION (to understand concept, NOT to memorize format):
"150 का 20% क्या है?"
Explanation: 20% of 150 = (20/100) × 150 = 30। यह percentage का basic concept है।

DO's:
✓ Understand the FORMULA: (P/100) × Value = Result
✓ Practice various number combinations
✓ Learn to identify percentage scenarios in real life

DON'Ts:
✗ Do NOT memorize the exact question format shown
✗ Do NOT expect all questions to ask "What is X% of Y?"
✗ Do NOT assume you know which numbers will appear

GENERATION RULE: Create varied percentage questions using different numbers and scenarios. Options must be 4 DISTINCT INTEGER answers (NO decimals like 30.0 or 30.00).`;
  } else {
    topicGuidance = `Generate questions specifically for the topic: ${topic}.
Focus on conceptual understanding, not memorizing patterns.
Options must be 4 distinct answers.`;
  }

  const system = `
You are a STRICT JSON generator for math questions on topic: ${topic}.

RULES:
- Output ONLY valid JSON, nothing else
- Ensure all JSON is properly closed
- Do NOT add any text outside the JSON
- Every generated question must be unique (no duplicates)
- Generate ONLY ${topic} questions, NOT other topics

LANGUAGE:
- Generate all questions ONLY in ${language}
- Use only ${language} words throughout
- Do NOT mix English with ${language}

CONCEPTUAL GUIDANCE (Help students learn concepts, not memorize patterns):
${topicGuidance}

EXAMPLE for ${language}:
Question: "${exampleQuestion}"
Options: ["26", "30", "28", "32"]
Answer Index: 1
Explanation: "${exampleExplanation}"
${blockedClause}

OUTPUT FORMAT (REQUIRED):
{
  "questions": [
    {
      "question": "[FULL QUESTION IN ${language}]",
      "options": ["[ANSWER1]", "[ANSWER2]", "[ANSWER3]", "[ANSWER4]"],
      "answerIndex": [0-3],
      "explanation": "[CONCEPTUAL EXPLANATION that teaches WHY this is correct, not just the answer]"
    }
  ]
}

EXPLANATION REQUIREMENTS (CRITICAL):
- MUST teach the CONCEPT/PRINCIPLE being tested
- MUST explain WHY this is the correct answer
- MUST help students understand the METHOD, not just memorize
- Example GOOD: "यह quadratic pattern है क्योंकि differences (4, 6, 8) खुद arithmetic sequence बना रहे हैं"
- Example BAD: "The answer is 30" or "26 + 4 = 30"

Generate ${count} UNIQUE, CONCEPTUAL ${topic} questions in JSON format.
`;

  console.log(`[generateBatch] Using language: ${language}`);
  console.log(`[generateBatch] Example question: ${exampleQuestion}`);

  // Marathi/Hindi text takes more tokens per character than English
  // Increase token budget for non-English languages
  const maxTokensForLanguage = (language === "English") ? 800 : 1600;

  const variationSeed = `${Date.now()}-${attempt}-${Math.random().toString(36).slice(2, 8)}`;
  const raw = await callLLM(
    system,
    `Generate now. Variation seed: ${variationSeed}`,
    maxTokensForLanguage,
    0.3
  );
  console.log(`[generateBatch] Raw response (first 200 chars): ${raw.slice(0, 200)}`);

  const items = parseQuestions(raw);
  console.log(`[generateBatch] Parsed ${items.length} items from response`);
  
  // For percentage topic, log the full raw response if parsing failed
  if (topic === "percentage" && items.length === 0) {
    console.log(`[generateBatch] PERCENTAGE PARSE FAILED. Full response:\n${raw.slice(0, 500)}`);
  }

  if (!items || items.length === 0) {
    try {
      const meta = `topic:${topic}\ndifficulty:${difficulty}\nlanguage:${language}\nrawLength:${String(raw?.length ?? 0)}\n`;
      dumpNvidiaDebug(`failed-${topic}-${difficulty}-${language}`, `${meta}\n${raw}`);
    } catch (e) {
      console.log("[generateBatch] failed to write debug dump:", e instanceof Error ? e.message : e);
    }
  }

  const structured1 = items
    .filter((q: unknown) => {
      if (!q || typeof q !== "object") return false;
      const item = q as Record<string, unknown>;
      return !!item["question"] && Array.isArray(item["options"]) && (item["options"] as unknown[]).length === 4;
    });
  
  console.log(`[generateBatch] After structure check: ${structured1.length} questions`);
  if (topic !== "number-patterns") {
    structured1.forEach((q: unknown, i: number) => {
      const item = q as Record<string, unknown>;
      console.log(`  [${i}] Q: "${String(item["question"] ?? "").slice(0, 60)}" | Opts: ${JSON.stringify(item["options"] ?? [])}`);
    });
  }

  const structured2 = structured1
    .map((q: unknown, i: number) => {
      const item = q as Record<string, unknown>;
      const questionText = sanitizeGeneratedQuestionText(String(item["question"] ?? ""));
      const options = (item["options"] as unknown[]).map((o) => normalizeChoiceText(String(o)));
      const answerIndex = typeof item["answerIndex"] === "number" ? (item["answerIndex"] as number) : 0;
      const explanation = normalizeWhitespace(String(item["explanation"] ?? ""));
      return {
        id: `q-${Date.now()}-${i}`,
        question: questionText,
        options: options as [string, string, string, string],
        answerIndex: Math.min(Math.max(answerIndex ?? 0, 0), 3),
        explanation,
        difficulty,
      };
    });
  
  console.log(`[generateBatch] After mapping: ${structured2.length} questions`);

  const structured3 = structured2
    .map((q: GeneratedQuestion) => cleanOptions(q));
  
  console.log(`[generateBatch] After cleanOptions: ${structured3.length} questions`);

  const structured4 = structured3
    .map((q: GeneratedQuestion) => (topic === "number-patterns" ? fixNumberPatternAnswer(q) : q));
  
  console.log(`[generateBatch] After fix/passthrough: ${structured4.length} questions`);

  const structuredQuestions = structured4
    .filter((q: GeneratedQuestion) => {
      const passes = validateQuestion(q);
      if (!passes) {
        if (topic === "percentage") console.log(`  [FILTER] validateQuestion failed: "${q.question.slice(0, 60)}" | opts: ${JSON.stringify(q.options)} | idx: ${q.answerIndex}`);
        return false;
      }
      
      const fullText = q.question + q.options.join(" ") + q.explanation;
      const langOk = isCorrectLanguage(fullText, language);
      if (!langOk) {
          if (topic === "percentage") console.log(`  [FILTER] language check failed for: "${q.question.slice(0, 60)}"`);
        return false;
      }

      if (topic === "number-patterns") {
        const patternOk = isValidNumberPattern(q);
        if (!patternOk) {
          console.log(`  [FILTER] isValidNumberPattern failed: "${q.question.slice(0, 60)}"`);
        }
        return patternOk;
      }

      if (topic === "percentage") {
        console.log(`  [PASS] Percentage question passed all filters: "${q.question.slice(0, 60)}" | opts: ${JSON.stringify(q.options)} | idx: ${q.answerIndex}`);
      }
      return true;
    });

  console.log(`[generateBatch] Final structured questions: ${structuredQuestions.length}`);
  return structuredQuestions;
}

export async function generateFastQuestions({
  topic,
  difficulty,
  count,
  language = "English",
  blockedQuestionSignatures = [],
}: {
  topic: string;
  difficulty: string;
  count: number;
  language?: string;
  blockedQuestionSignatures?: string[];
}) {
  const questions: GeneratedQuestion[] = [];
  const maxAttempts = Math.max(3, Math.ceil(count / 2) + 1);
  const deadline = Date.now() + QUESTION_GENERATION_BUDGET_MS;
  let attempts = 0;
  const seen = new Set<string>(
    blockedQuestionSignatures.map((value) => normalizeQuestionSignature(value, topic))
  );

  while (questions.length < count && attempts < maxAttempts && Date.now() < deadline) {
    attempts += 1;
    const remaining = count - questions.length;
    const candidateCount = Math.min(8, Math.max(remaining + 2, 3));
    const batch = await generateBatch(
      topic,
      difficulty,
      candidateCount,
      language,
      Array.from(seen),
      attempts
    );

    for (const q of batch) {
      const signature = normalizeQuestionSignature(q.question, topic);
      if (!signature || seen.has(signature)) {
        continue;
      }

      seen.add(signature);

      if (!questions.some((x) => normalizeQuestionSignature(x.question, topic) === signature)) {
        questions.push(q);
      }
    }

    if (batch.length === 0) {
      console.log(`[generateFastQuestions] Empty batch at attempt ${attempts}, continuing`);
      continue;
    }
  }

  const finalQuestions = questions.slice(0, count);
  console.log(`[generateFastQuestions] Completed: got ${finalQuestions.length}/${count} questions in ${attempts} attempts, ${Date.now() - deadline + QUESTION_GENERATION_BUDGET_MS}ms elapsed`);

  return finalQuestions;
}

export async function getMathExplanation(
  topic: string,
  question: string,
  options: string[],
  correctAnswer: string,
  baseExplanation: string,
  language = "English"
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return baseExplanation || `Final Answer: ${correctAnswer}`;
  }

  const system = `
You are an expert math teacher.

Explain the answer in ${language}.

Rules:
- Explain it properly for a student who is learning the concept.
- Use 3 short steps or 3 short lines: identify the pattern, apply the rule, state the answer.
- Use simple student-friendly language.
- Do not change the correct answer.
- If ${language} is not English, keep the explanation fully in ${language}.
- For Hindi and Marathi, use Devanagari script only. Do not use Latin transliteration.
- Return only the explanation text.
`;

  const user = `
Topic: ${topic}
Question: ${question}
Options: ${options.join(" | ")}
Correct Answer: ${correctAnswer}
Base Explanation: ${baseExplanation}
`;

  const raw = await callLLM(system, user, 300);
  const explanation = raw.trim();

  return explanation || baseExplanation || `Final Answer: ${correctAnswer}`;
}
