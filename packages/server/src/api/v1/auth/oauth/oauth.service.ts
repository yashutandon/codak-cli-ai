import { db } from "@codak/database";
import { signAccessToken, createRefreshToken } from "../auth.service";

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
    // Existing email/password account — just issue tokens (don't override password)
    console.log(`[OAuth] Existing account linked for: ${profile.email}`);
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user };
}