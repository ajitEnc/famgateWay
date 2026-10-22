import { sql } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { getSessionId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const id = await getSessionId();
  if (!id) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const [m] = await sql`select email, upi_id, imap_user, imap_pass_enc, sender_filter, api_key, webhook_url, webhook_secret from merchants where id = ${id}`;
  const orders = await sql`select id, order_ref, payable_amount, status, utr, created_at from orders where merchant_id = ${id} order by created_at desc limit 20`;
  const { imap_pass_enc, ...rest } = m;
  return Response.json({ ...rest, has_imap_pass: !!imap_pass_enc, orders });
}

export async function PUT(req) {
  const id = await getSessionId();
  if (!id) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json();
  await sql`update merchants set upi_id = ${b.upi_id || null}, imap_user = ${b.imap_user || null},
    sender_filter = ${b.sender_filter || 'fampay'}, webhook_url = ${b.webhook_url || null} where id = ${id}`;
  if (b.imap_pass) await sql`update merchants set imap_pass_enc = ${encrypt(b.imap_pass.replace(/\s/g, ''))} where id = ${id}`;
  return Response.json({ ok: true });
}
