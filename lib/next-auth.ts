import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure first successful login lands on dashboard, not home/login.
      if (url.startsWith("/")) {
        if (url === "/" || url.startsWith("/login")) {
          return "/tool";
        }
        return url;
      }

      try {
        const target = new URL(url);
        if (target.origin === baseUrl) {
          if (target.pathname === "/" || target.pathname === "/login") {
            return `${baseUrl}/tool`;
          }
          return url;
        }
      } catch {
        // Fall through to safe default.
      }

      return `${baseUrl}/tool`;
    },
  },
};