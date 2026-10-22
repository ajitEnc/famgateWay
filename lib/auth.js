import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from './db';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export async function setSession(id) {
  const t = await new SignJWT({ id }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(secret());
  cookies().set('s', t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}

export async function getSessionId() {
  const c = cookies().get('s')?.value;
  if (!c) return null;
  try { return (await jwtVerify(c, secret())).payload.id; } catch { return null; }
}

export function clearSession() { cookies().delete('s'); }

export async function merchantByKey(req) {
  const key = req.headers.get('x-api-key');
  if (!key) return null;
  const [m] = await sql`select * from merchants where api_key = ${key}`;
  return m || null;
}
