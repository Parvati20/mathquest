import { topicsData } from "@/lib/topicsData";
import type { UserProgress } from "@/lib/userProgress";

const PASS_ACCURACY_PERCENT = 60;

export type TopicPassStatus = {
  topicId: string;
  title: string;
  attempts: number;
  solved: number;
  accuracy: number;
  passed: boolean;
};

export type MockEligibility = {
  canTakeMock: boolean;
  canRetakeNow: boolean;
  needsWeakTopicPractice: boolean;
  requiredAccuracy: number;
  passedTopics: number;
  totalTopics: number;
  pendingWeakTopics: TopicPassStatus[];
  topics: TopicPassStatus[];
};

export function getMockEligibility(progress: UserProgress | null): MockEligibility {
  const topicIds = Object.keys(topicsData) as Array<keyof typeof topicsData>;

  const topics: TopicPassStatus[] = topicIds.map((topicId) => {
    const stats = progress?.topicProgress?.[topicId] ?? { solved: 0, attempts: 0, wrong: 0, points: 0 };
    const accuracy = stats.attempts > 0 ? Math.round((stats.solved / stats.attempts) * 100) : 0;
    const passed = stats.attempts > 0 && accuracy >= PASS_ACCURACY_PERCENT;

    return {
      topicId,
      title: topicsData[topicId].title,
      attempts: stats.attempts,
      solved: stats.solved,
      accuracy,
      passed,
    };
  });

  const passedTopics = topics.filter((topic) => topic.passed).length;
  const latestMock = progress?.mockHistory?.[progress.mockHistory.length - 1] ?? null;
  const latestMockCreatedAt = latestMock?.createdAt ? new Date(latestMock.createdAt) : null;
  const mockWeakTopicIds = Array.isArray(latestMock?.weakTopicIds)
    ? latestMock.weakTopicIds.filter((topicId): topicId is string => typeof topicId === "string" && topicId in topicsData)
    : [];
  const practicedTopicIdsAfterLastMock = new Set(
    (progress?.practiceSessions ?? [])
      .filter((session) => {
        if (!latestMockCreatedAt || Number.isNaN(latestMockCreatedAt.getTime())) {
          return false;
        }

        const practicedAt = new Date(session.createdAt);
        return !Number.isNaN(practicedAt.getTime()) && practicedAt > latestMockCreatedAt;
      })
      .map((session) => session.topicId),
  );
  const pendingWeakTopics = topics.filter(
    (topic) => mockWeakTopicIds.includes(topic.topicId) && !practicedTopicIdsAfterLastMock.has(topic.topicId),
  );
  const needsWeakTopicPractice = pendingWeakTopics.length > 0;
  const canRetakeNow = !needsWeakTopicPractice;
  const canTakeMock = passedTopics === topics.length && canRetakeNow;

  return {
    canTakeMock,
    canRetakeNow,
    needsWeakTopicPractice,
    requiredAccuracy: PASS_ACCURACY_PERCENT,
    passedTopics,
    totalTopics: topics.length,
    pendingWeakTopics,
    topics,
  };
}
