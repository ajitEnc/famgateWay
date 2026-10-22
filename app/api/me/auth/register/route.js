import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { rand } from '@/lib/crypto';
import { setSession } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 8)
    return Response.json({ error: 'Valid email and 8+ char password required' }, { status: 400 });
  const hash = await bcrypt.hash(password, 10);
  try {
    const [m] = await sql`insert into merchants (email, password_hash, api_key, webhook_secret)
      values (${email.toLowerCase()}, ${hash}, ${'pd_' + rand(24)}, ${rand(24)}) returning id`;
    await setSession(m.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }
}
