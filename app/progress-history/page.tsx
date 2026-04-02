import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProgressHistoryClient from "@/components/ProgressHistoryClient";
import { authOptions } from "@/lib/next-auth";
import { getUserProgress, repairUserProgress } from "@/lib/userProgress";

export default async function ProgressHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=%2Fprogress-history");
  }

  const progress = await getUserProgress(session.user.email);
  const repairedProgress = repairUserProgress(progress, session.user.email);

  return (
    <ProgressHistoryClient
      session={session}
      progress={repairedProgress}
    />
  );
}
