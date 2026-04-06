import { questionsData, type TopicQuestion } from "@/lib/questionsData";
import { topicsData } from "@/lib/topicsData";

export type MockQuestion = TopicQuestion & {
  topic: string;
  topicTitle: string;
};

export const MOCK_SESSION_COUNT = 20;

export function normalizeSeed(seed: number | string | undefined) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.abs(Math.trunc(seed));
  }

  if (typeof seed === "string") {
    const parsed = Number.parseInt(seed, 10);
    if (Number.isFinite(parsed)) {
      return Math.abs(parsed);
    }
  }

  return Math.abs(Date.now());
}

export function seededShuffle<T>(items: T[], seed: number) {
  const output = [...items];
  let state = (seed || 1) >>> 0;

  for (let index = output.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

export function getMockTopicTitle(topic: string) {
  return topicsData[topic as keyof typeof topicsData]?.title ?? topic;
}

export function makeQuestionSignature(question: string) {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

export function buildMockFallbackSession(
  seed: number,
  count = MOCK_SESSION_COUNT,
  blockedSignatures: string[] = [],
): MockQuestion[] {
  const topicEntries = Object.entries(questionsData);
  if (topicEntries.length === 0) {
    return [];
  }

  const basePerTopic = Math.floor(count / topicEntries.length);
  const remainder = count % topicEntries.length;
  const seen = new Set(
    blockedSignatures
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  const buckets: MockQuestion[][] = topicEntries.map(([topic, pool], topicIndex) => {
    const topicTitle = getMockTopicTitle(topic);
    const shuffled = seededShuffle(pool, seed + (topicIndex + 1) * 97);

    return shuffled.map((question) => ({
      ...question,
      topic,
      topicTitle,
    }));
  });

  const mixed: MockQuestion[] = [];
  let cursor = 0;

  while (mixed.length < count) {
    let pushed = false;

    for (const bucket of buckets) {
      const desiredCount = basePerTopic + (buckets.indexOf(bucket) < remainder ? 1 : 0);
      const currentTopicCount = mixed.filter((question) => question.topic === bucket[0]?.topic).length;

      if (currentTopicCount >= desiredCount) {
        continue;
      }

      const candidate = bucket[cursor];

      if (!candidate) {
        continue;
      }

      const signature = makeQuestionSignature(candidate.question);
      if (seen.has(signature)) {
        continue;
      }

      seen.add(signature);
      mixed.push(candidate);
      pushed = true;
    }

    if (!pushed) {
      break;
    }

    cursor += 1;
  }

  return mixed.slice(0, count);
}

export function mergeMockQuestions(
  generated: MockQuestion[],
  seed: number,
  count = MOCK_SESSION_COUNT,
  blockedSignatures: string[] = [],
) {
  const merged: MockQuestion[] = [];
  const seen = new Set(
    blockedSignatures
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  const pushQuestion = (question: MockQuestion) => {
    const signature = makeQuestionSignature(question.question);
    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    merged.push(question);
    return true;
  };

  for (const question of generated) {
    if (merged.length >= count) {
      break;
    }

    pushQuestion(question);
  }

  if (merged.length < count) {
    const fallback = buildMockFallbackSession(seed, count * 3, Array.from(seen));

    for (const question of fallback) {
      if (merged.length >= count) {
        break;
      }

      pushQuestion(question);
    }
  }

  return merged.slice(0, count);
}