import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { setSession } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const [m] = await sql`select id, password_hash from merchants where email = ${(email || '').toLowerCase()}`;
  if (!m || !(await bcrypt.compare(password || '', m.password_hash)))
    return Response.json({ error: 'Wrong email or password' }, { status: 401 });
  await setSession(m.id);
  return Response.json({ ok: true });
}
