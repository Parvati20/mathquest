import { getServerSession } from "next-auth";
import { topicsData } from "@/lib/topicsData";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import TopicContentClient from "@/components/TopicContentClient";
import { authOptions } from "@/lib/next-auth";

interface PageProps {
  params: Promise<{ topic: string }>;
}

export default async function TopicPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { topic } = await params;
  const data = topicsData[topic as keyof typeof topicsData];

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/${topic}`)}`);
  }

  if (!data) return notFound();

  return <TopicContentClient topic={topic as keyof typeof topicsData} session={session} />;
}