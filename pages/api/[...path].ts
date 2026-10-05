import type { NextApiRequest, NextApiResponse } from "next";
import { getRequestAuthorization } from "@/lib/authCookie";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return res.status(503).json({ error: "Le service de l’application n’est pas configuré." });
  }

  const method = req.method || "GET";
  if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, HEAD, POST, PUT, PATCH, DELETE");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const rawPathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const pathParts = rawPathParts.filter((part): part is string => typeof part === "string");
  if (
    pathParts.length !== rawPathParts.length ||
    pathParts.some(
      (part) =>
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes("\\"),
    )
  ) {
    return res.status(400).json({ error: "Chemin de requête invalide." });
  }
  const headers = new Headers();
  const contentType = req.headers["content-type"];
  if (contentType) headers.set("Content-Type", contentType);
  const authorization = getRequestAuthorization(req);
  if (authorization) headers.set("Authorization", authorization);

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD" && req.body !== undefined) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  try {
    const backend = new URL(backendUrl);
    if (!["http:", "https:"].includes(backend.protocol)) {
      throw new Error("Backend URL must use HTTP or HTTPS.");
    }
    const incomingUrl = new URL(req.url || "/", "http://localhost");
    const target = new URL(`/api/${pathParts.map(encodeURIComponent).join("/")}`, backend.origin);
    target.search = incomingUrl.search;
    const response = await fetch(target, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(30_000),
    });
    const responseBody = await response.text();
    const responseType = response.headers.get("content-type");
    if (responseType) res.setHeader("Content-Type", responseType);
    res.setHeader("Cache-Control", "no-store");
    return res.status(response.status).send(responseBody);
  } catch (error) {
    console.error("[API/Proxy] Backend request failed:", error);
    return res.status(502).json({ error: "Impossible de contacter le service de l’application." });
  }
}
