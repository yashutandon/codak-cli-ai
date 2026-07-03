import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { db } from "@codak/database";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export interface OAuthProfile {
  id: string;
  email: string;
  name: string | null;
  provider: "github" | "google";
}

export async function findOrCreateOAuthUser(profile: OAuthProfile) {
  let user = await db.user.findUnique({
    where: { email: profile.email },
    select: { id: true, email: true, name: true, isOAuthUser: true },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: profile.email,
        name: profile.name ?? null,
        password: null,       // OAuth users have no password
        isOAuthUser: true,
      },
      select: { id: true, email: true, name: true, isOAuthUser: true },
    });
  } else if (!user.isOAuthUser) {
    // Existing email/password account — link OAuth but don't change password
    // Just issue a token for the existing account
    console.log(`[OAuth] Existing account linked for: ${profile.email}`);
  }

  const accessToken = jwt.sign({ sub: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return { accessToken, user };
}