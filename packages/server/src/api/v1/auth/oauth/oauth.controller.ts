import type { Request, Response, NextFunction } from "express";
import { findOrCreateOAuthUser } from "./oauth.service";
import { AppError } from "../../../../utils/AppError";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

// ── GitHub ────────────────────────────────────────────────────

export async function githubInit(req: Request, res: Response): Promise<void> {
  const state = req.query.state as string ?? "";
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: "user:email",
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

export async function githubCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, state } = req.query as { code: string; state: string };

    if (!code) throw new AppError("No code received from GitHub", 400);

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) throw new AppError(tokenData.error_description ?? "GitHub auth failed", 400);

    const accessToken = tokenData.access_token as string;

    // Get user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const profile = await profileRes.json() as any;

    // Get primary email if not in profile
    let email = profile.email as string | null;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      const emails = await emailsRes.json() as any[];
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? null;
    }

    if (!email) throw new AppError("No email found in GitHub account", 400);

    const result = await findOrCreateOAuthUser({
      id: String(profile.id),
      email,
      name: profile.name ?? profile.login ?? null,
      provider: "github",
    });

    // Redirect back to web with token
    const params = new URLSearchParams({
      token: result.accessToken,
      state: state ?? "",
    });

    res.redirect(`${WEB_URL}/auth/callback?${params}`);
  } catch (err) {
    next(err);
  }
}

// ── Google ────────────────────────────────────────────────────

export async function googleInit(req: Request, res: Response): Promise<void> {
  const state = req.query.state as string ?? "";
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.SERVER_URL ?? "http://localhost:3001"}/api/v1/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, state } = req.query as { code: string; state: string };

    if (!code) throw new AppError("No code received from Google", 400);

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.SERVER_URL ?? "http://localhost:3001"}/api/v1/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) throw new AppError(tokenData.error_description ?? "Google auth failed", 400);

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json() as any;

    if (!profile.email) throw new AppError("No email found in Google account", 400);

    const result = await findOrCreateOAuthUser({
      id: profile.id,
      email: profile.email,
      name: profile.name ?? null,
      provider: "google",
    });

    const params = new URLSearchParams({
      token: result.accessToken,
      state: state ?? "",
    });

    res.redirect(`${WEB_URL}/auth/callback?${params}`);
  } catch (err) {
    next(err);
  }
}