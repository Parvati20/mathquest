import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ToolDashboardClient from "@/components/ToolDashboardClient";
import { authOptions } from "@/lib/next-auth";

export default async function ToolPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  return <ToolDashboardClient session={session} />;
}