import { mongoClientPromise } from "./mongodb";

export interface TopicStats {
  solved: number;
  attempts: number;
  points: number;
}

export interface UserProgress {
  userId: string;
  topicProgress: Record<string, TopicStats>;
  totalSolved: number;
  totalPoints: number;
  mockAttempts: number;
  mockBestScore: number;
  updatedAt: Date;
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const client = await mongoClientPromise;
  const db = client.db();
  const doc = await db
    .collection<UserProgress>("userProgress")
    .findOne({ userId }, { projection: { _id: 0 } });
  return doc;
}

export async function savePracticeSession(
  userId: string,
  topicId: string,
  correctCount: number,
  totalCount: number,
): Promise<void> {
  const client = await mongoClientPromise;
  const db = client.db();
  const points = correctCount * 4;

  await db.collection("userProgress").updateOne(
    { userId },
    {
      $inc: {
        [`topicProgress.${topicId}.solved`]: correctCount,
        [`topicProgress.${topicId}.attempts`]: totalCount,
        [`topicProgress.${topicId}.points`]: points,
        totalSolved: correctCount,
        totalPoints: points,
      },
      $set: { updatedAt: new Date() },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );
}

export async function saveMockTest(
  userId: string,
  correctCount: number,
  score: number,
): Promise<void> {
  const client = await mongoClientPromise;
  const db = client.db();

  await db.collection("userProgress").updateOne(
    { userId },
    {
      $inc: { mockAttempts: 1 },
      $max: { mockBestScore: score },
      $set: { updatedAt: new Date() },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );
}
