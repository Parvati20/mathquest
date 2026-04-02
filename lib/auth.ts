import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "mathquest_auth";

type AuthTokenPayload = {
  userId: string;
  email: string;
  name: string;
};

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

const resolvedJwtSecret: string = jwtSecret;

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, resolvedJwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, resolvedJwtSecret) as AuthTokenPayload;
}
