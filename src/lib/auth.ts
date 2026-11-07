import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "klin_admin_session";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "klin-admin";
}

export function adminSessionToken() {
  const secret =
    process.env.ADMIN_SESSION_SECRET || "klin-local-development-secret";
  return createHash("sha256").update(`${adminPassword()}:${secret}`).digest("hex");
}

export function verifyPassword(input: string) {
  const expected = Buffer.from(adminPassword());
  const actual = Buffer.from(input);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = adminSessionToken();
  if (token.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export function unauthorizedResponse() {
  return Response.json({ error: "Требуется авторизация" }, { status: 401 });
}
