import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MockTestClient from "@/components/MockTestClient";
import { authOptions } from "@/lib/next-auth";

export default async function MockTestStartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=%2Fmock-test%2Fstart");
  }

  return <MockTestClient />;
}
