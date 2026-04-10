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
    if (!client) {
      throw new Error("MongoDB connection unavailable");
    }

    const db = client.db();
    const collection = db.collection<UserProgress>("userProgress");
    const emptyProgress = createEmptyUserProgress(userId);

    // Auto-create a user document on first authenticated read (login/open dashboard).
    await collection.updateOne(
      { userId },
      {
        $setOnInsert: {
          userId: emptyProgress.userId,
          topicProgress: emptyProgress.topicProgress,
          totalSolved: emptyProgress.totalSolved,
          totalAttempts: emptyProgress.totalAttempts,
          totalWrong: emptyProgress.totalWrong,
          totalPoints: emptyProgress.totalPoints,
          mockAttempts: emptyProgress.mockAttempts,
          mockBestScore: emptyProgress.mockBestScore,
          practiceSessions: emptyProgress.practiceSessions,
          mockHistory: emptyProgress.mockHistory,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    const doc = await collection.findOne({ userId }, { projection: { _id: 0 } });
    return doc;
  } catch (error) {
    console.error("getUserProgress failed:", error);
    throw error;
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
    if (!client) {
      throw new Error("MongoDB connection unavailable");
    }

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
  } catch (error) {
    console.error("savePracticeSession failed:", error);
    throw error;
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
    if (!client) {
      throw new Error("MongoDB connection unavailable");
    }

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
  } catch (error) {
    console.error("saveMockTest failed:", error);
    throw error;
  }
}

export async function clearUserProgress(userId: string): Promise<void> {
  try {
    const client = await getMongoClient();
    if (!client) {
      throw new Error("MongoDB connection unavailable");
    }

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
  } catch (error) {
    console.error("clearUserProgress failed:", error);
    throw error;
  }
}
