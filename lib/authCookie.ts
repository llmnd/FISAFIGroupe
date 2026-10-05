import type { NextApiRequest, NextApiResponse } from "next";

export const AUTH_COOKIE_NAME = "fisafi_session";
export const AUTH_MIGRATION_COOKIE_NAME = "fisafi_auth_migrated";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const AUTH_MIGRATION_MAX_AGE = 365 * 24 * 60 * 60;

export function getRequestAuthorization(req: NextApiRequest): string | undefined {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ") && authorization.slice(7).trim()) return authorization;

  const token = req.cookies[AUTH_COOKIE_NAME];
  return token ? `Bearer ${token}` : undefined;
}

export function setAuthCookie(
  req: NextApiRequest,
  res: NextApiResponse,
  token: string,
): void {
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol;
  const isHttps = protocol
    ? protocol.split(",")[0].trim() === "https"
    : process.env.NODE_ENV === "production";
  const attributes = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (domain) attributes.push(`Domain=${domain}`);
  if (isHttps) attributes.push("Secure");

  const migrationAttributes = [
    `${AUTH_MIGRATION_COOKIE_NAME}=1`,
    "Path=/",
    `Max-Age=${AUTH_MIGRATION_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (domain) migrationAttributes.push(`Domain=${domain}`);
  if (isHttps) migrationAttributes.push("Secure");

  res.setHeader("Set-Cookie", [attributes.join("; "), migrationAttributes.join("; ")]);
}

export function clearAuthCookie(res: NextApiResponse): void {
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const attributes = [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (domain) attributes.push(`Domain=${domain}`);
  if (process.env.NODE_ENV === "production") attributes.push("Secure");

  res.setHeader("Set-Cookie", attributes.join("; "));
}
