import { topicsData } from "@/lib/topicsData";
import { notFound } from "next/navigation";
import TopicContentClient from "@/components/TopicContentClient";

interface PageProps {
  params: Promise<{ topic: string }>;
}

export default async function TopicPage({ params }: PageProps) {
  const { topic } = await params;
  const data = topicsData[topic as keyof typeof topicsData];

  if (!data) return notFound();

  return <TopicContentClient topic={topic as keyof typeof topicsData} />;
}