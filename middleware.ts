import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Only allow access when JWT contains an authenticated user email.
  if (typeof token?.email === "string" && token.email.length > 0) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/tool/:path*",
    "/mock-test/:path*",
    "/:topic(number-patterns|percentage|work-time|linear-equations|simple-interest|profit-loss)/:path*",
  ],
};
