import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

export const authOptions: NextAuthOptions = {
  providers: hasGoogleOAuth
    ? [
        GoogleProvider({
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
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
      }

      return `${baseUrl}/tool`;
    },
  },
};