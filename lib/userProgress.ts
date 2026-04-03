import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getMongoClient } from "./mongodb";

export interface TopicStats {
  solved: number;
  attempts: number;
  wrong: number;
  points: number;
}

export interface PracticeSessionSnapshot {
  topicId: string;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  points: number;
  accuracy: number;
  createdAt: Date;
}

export interface MockSessionSnapshot {
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  score: number;
  accuracy: number;
  weakTopicIds?: string[];
  createdAt: Date;
}

export interface UserProgress {
  userId: string;
  topicProgress: Record<string, TopicStats>;
  totalSolved: number;
  totalAttempts: number;
  totalWrong: number;
  totalPoints: number;
  mockAttempts: number;
  mockBestScore: number;
  practiceSessions: PracticeSessionSnapshot[];
  mockHistory: MockSessionSnapshot[];
  updatedAt: Date;
}

type ProgressStore = Record<string, UserProgress>;

const fallbackStorePath = path.join(process.cwd(), ".data", "user-progress.json");

async function readFallbackStore(): Promise<ProgressStore> {
  try {
    const raw = await readFile(fallbackStorePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const store: ProgressStore = {};

    for (const [userId, value] of Object.entries(parsed)) {
      if (value && typeof value === "object") {
        store[userId] = value as UserProgress;
      }
    }

    return store;
  } catch {
    return {};
  }
}

async function writeFallbackStore(store: ProgressStore): Promise<void> {
  await mkdir(path.dirname(fallbackStorePath), { recursive: true });
  await writeFile(fallbackStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function applyPracticeSession(progress: UserProgress, topicId: string, correctCount: number, totalCount: number): UserProgress {
  const safeTotal = Math.max(0, totalCount);
  const safeCorrect = Math.max(0, Math.min(correctCount, safeTotal));
  const wrongCount = Math.max(0, safeTotal - safeCorrect);
  const points = safeCorrect * 4;

  const currentTopic = progress.topicProgress[topicId] ?? {
    solved: 0,
    attempts: 0,
    wrong: 0,
    points: 0,
  };

  return {
    ...progress,
    topicProgress: {
      ...progress.topicProgress,
      [topicId]: {
        solved: (currentTopic.solved ?? 0) + safeCorrect,
        attempts: (currentTopic.attempts ?? 0) + safeTotal,
        wrong: (currentTopic.wrong ?? 0) + wrongCount,
        points: (currentTopic.points ?? 0) + points,
      },
    },
    totalSolved: (progress.totalSolved ?? 0) + safeCorrect,
    totalAttempts: (progress.totalAttempts ?? 0) + safeTotal,
    totalWrong: (progress.totalWrong ?? 0) + wrongCount,
    totalPoints: (progress.totalPoints ?? 0) + points,
    practiceSessions: [
      ...(progress.practiceSessions ?? []),
      {
        topicId,
        correctCount: safeCorrect,
        wrongCount,
        totalCount: safeTotal,
        points,
        accuracy: safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0,
        createdAt: new Date(),
      },
    ].slice(-120),
    updatedAt: new Date(),
  };
}

function applyMockTest(
  progress: UserProgress,
  correctCount: number,
  score: number,
  wrongCount: number,
  totalCount: number,
  weakTopicIds: string[],
): UserProgress {
  const safeTotal = Math.max(0, totalCount);
  const safeCorrect = Math.max(0, Math.min(correctCount, safeTotal));
  const safeWrong = Math.max(0, Math.min(wrongCount, safeTotal));
  const safeScore = Math.max(0, score);

  return {
    ...progress,
    mockAttempts: (progress.mockAttempts ?? 0) + 1,
    mockBestScore: Math.max(progress.mockBestScore ?? 0, safeScore),
    mockHistory: [
      ...(progress.mockHistory ?? []),
      {
        correctCount: safeCorrect,
        wrongCount: safeWrong,
        totalCount: safeTotal,
        score: safeScore,
        accuracy: safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0,
        weakTopicIds,
        createdAt: new Date(),
      },
    ].slice(-60),
    updatedAt: new Date(),
  };
}

export function createEmptyUserProgress(userId: string): UserProgress {
  return {
    userId,
    totalSolved: 0,
    totalAttempts: 0,
    totalWrong: 0,
    totalPoints: 0,
    topicProgress: {},
    mockAttempts: 0,
    mockBestScore: 0,
    practiceSessions: [],
    mockHistory: [],
    updatedAt: new Date(),
  };
}

export function repairUserProgress(progress: UserProgress | null, userId: string): UserProgress {
  const normalizedProgress = progress ?? createEmptyUserProgress(userId);
  const topicEntries = Object.values(normalizedProgress.topicProgress ?? {});

  const derivedSolved = topicEntries.reduce((sum, stats) => sum + (stats?.solved ?? 0), 0);
  const derivedAttempts = topicEntries.reduce((sum, stats) => sum + (stats?.attempts ?? 0), 0);
  const derivedWrong = topicEntries.reduce(
    (sum, stats) => sum + (stats?.wrong ?? Math.max(0, (stats?.attempts ?? 0) - (stats?.solved ?? 0))),
    0,
  );
  const derivedPoints = topicEntries.reduce((sum, stats) => sum + (stats?.points ?? 0), 0);

  return {
    ...normalizedProgress,
    totalSolved:
      (normalizedProgress.totalSolved ?? 0) > 0 || derivedSolved === 0
        ? normalizedProgress.totalSolved
        : derivedSolved,
    totalAttempts:
      (normalizedProgress.totalAttempts ?? 0) > 0 || derivedAttempts === 0
        ? normalizedProgress.totalAttempts
        : derivedAttempts,
    totalWrong:
      (normalizedProgress.totalWrong ?? 0) > 0 || derivedWrong === 0
        ? normalizedProgress.totalWrong
        : derivedWrong,
    totalPoints:
      (normalizedProgress.totalPoints ?? 0) > 0 || derivedPoints === 0
        ? normalizedProgress.totalPoints
        : derivedPoints,
    practiceSessions: normalizedProgress.practiceSessions ?? [],
    mockHistory: normalizedProgress.mockHistory ?? [],
  };
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const client = await getMongoClient();

    if (client) {
      const db = client.db();
      const doc = await db
        .collection<UserProgress>("userProgress")
        .findOne({ userId }, { projection: { _id: 0 } });
      return doc;
    }

    const store = await readFallbackStore();
    return store[userId] ?? null;
  } catch (error) {
    console.error("getUserProgress failed, returning null fallback:", error);
    return null;
  }
}

export async function savePracticeSession(
  userId: string,
  topicId: string,
  correctCount: number,
  totalCount: number,
): Promise<void> {
  try {
    const client = await getMongoClient();

    if (client) {
      const db = client.db();
      const safeTotal = Math.max(0, totalCount);
      const safeCorrect = Math.max(0, Math.min(correctCount, safeTotal));
      const wrongCount = Math.max(0, safeTotal - safeCorrect);
      const points = safeCorrect * 4;
      const accuracy = safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

      await db.collection<UserProgress>("userProgress").updateOne(
        { userId },
        {
          $inc: {
            [`topicProgress.${topicId}.solved`]: safeCorrect,
            [`topicProgress.${topicId}.attempts`]: safeTotal,
            [`topicProgress.${topicId}.wrong`]: wrongCount,
            [`topicProgress.${topicId}.points`]: points,
            totalSolved: safeCorrect,
            totalAttempts: safeTotal,
            totalWrong: wrongCount,
            totalPoints: points,
          },
          $push: {
            practiceSessions: {
              $each: [
                {
                  topicId,
                  correctCount: safeCorrect,
                  wrongCount,
                  totalCount: safeTotal,
                  points,
                  accuracy,
                  createdAt: new Date(),
                },
              ],
              $slice: -120,
            },
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            userId,
            mockAttempts: 0,
            mockBestScore: 0,
            mockHistory: [],
          },
        },
        { upsert: true },
      );

      return;
    }

    const store = await readFallbackStore();
    const current = store[userId] ?? createEmptyUserProgress(userId);
    store[userId] = applyPracticeSession(current, topicId, correctCount, totalCount);
    await writeFallbackStore(store);
  } catch (error) {
    console.error("savePracticeSession failed, skipping persist:", error);
  }
}

export async function saveMockTest(
  userId: string,
  correctCount: number,
  score: number,
  wrongCount: number,
  totalCount: number,
  weakTopicIds: string[] = [],
): Promise<void> {
  try {
    const client = await getMongoClient();

    if (client) {
      const db = client.db();
      const safeTotal = Math.max(0, totalCount);
      const safeCorrect = Math.max(0, Math.min(correctCount, safeTotal));
      const safeWrong = Math.max(0, Math.min(wrongCount, safeTotal));
      const safeScore = Math.max(0, score);
      const accuracy = safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

      await db.collection<UserProgress>("userProgress").updateOne(
        { userId },
        {
          $inc: { mockAttempts: 1 },
          $max: { mockBestScore: safeScore },
          $push: {
            mockHistory: {
              $each: [
                {
                  correctCount: safeCorrect,
                  wrongCount: safeWrong,
                  totalCount: safeTotal,
                  score: safeScore,
                  accuracy,
                  weakTopicIds,
                  createdAt: new Date(),
                },
              ],
              $slice: -60,
            },
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            userId,
            topicProgress: {},
            practiceSessions: [],
            totalSolved: 0,
            totalAttempts: 0,
            totalWrong: 0,
            totalPoints: 0,
          },
        },
        { upsert: true },
      );

      return;
    }

    const store = await readFallbackStore();
    const current = store[userId] ?? createEmptyUserProgress(userId);
    store[userId] = applyMockTest(current, correctCount, score, wrongCount, totalCount, weakTopicIds);
    await writeFallbackStore(store);
  } catch (error) {
    console.error("saveMockTest failed, skipping persist:", error);
  }
}

export async function clearUserProgress(userId: string): Promise<void> {
  try {
    const client = await getMongoClient();

    if (client) {
      const db = client.db();
      const empty = createEmptyUserProgress(userId);

      await db.collection<UserProgress>("userProgress").updateOne(
        { userId },
        {
          $set: {
            userId: empty.userId,
            topicProgress: empty.topicProgress,
            totalSolved: empty.totalSolved,
            totalAttempts: empty.totalAttempts,
            totalWrong: empty.totalWrong,
            totalPoints: empty.totalPoints,
            mockAttempts: empty.mockAttempts,
            mockBestScore: empty.mockBestScore,
            practiceSessions: empty.practiceSessions,
            mockHistory: empty.mockHistory,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      return;
    }

    const store = await readFallbackStore();
    store[userId] = createEmptyUserProgress(userId);
    await writeFallbackStore(store);
  } catch (error) {
    console.error("clearUserProgress failed:", error);
  }
}
