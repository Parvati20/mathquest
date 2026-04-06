import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import TopicPracticeClient from "@/components/TopicPracticeClient";
import { topicsData } from "@/lib/topicsData";
import { authOptions } from "@/lib/next-auth";

type PageProps = {
  params: Promise<{ topic: string }>;
};

export default async function TopicPracticePage({ params }: PageProps) {
  const { topic } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/${topic}/practice`)}`);
  }

  const topicInfo = topicsData[topic as keyof typeof topicsData];

  if (!topicInfo) {
    return notFound();
  }

  return <TopicPracticeClient topic={topic} />;
}
