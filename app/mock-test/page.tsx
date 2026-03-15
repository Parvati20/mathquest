import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MockTestIntroClient from "@/components/MockTestIntroClient";
import { authOptions } from "@/lib/next-auth";

export default async function MockTestIntroPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  return <MockTestIntroClient session={session} />;
}
