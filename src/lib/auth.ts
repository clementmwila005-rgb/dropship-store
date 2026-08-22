import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "./supabase";

const COOKIE_NAME = "session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET || "dev-secret-change-me-1234567890";
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ id: user.id, name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.APP_URL || "http://localhost:3000").startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  return session;
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const { data: dbUser } = await supabase
    .from("User")
    .select("id, name, email, role")
    .eq("id", session.id)
    .single();
  if (!dbUser || dbUser.role !== "admin") return null;
  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
}
