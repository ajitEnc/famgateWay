import { sql } from '@/lib/db';
import { merchantByKey } from '@/lib/auth';
import { checkMerchant } from '@/lib/verify';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req, { params }) {
  const m = await merchantByKey(req);
  if (!m) return Response.json({ error: 'invalid api key' }, { status: 401 });
  await checkMerchant(m);
  const [o] = await sql`select id, order_ref, payable_amount, status, utr, paid_at, expires_at from orders where id = ${params.id} and merchant_id = ${m.id}`;
  if (!o) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json({ order_id: o.id, ...o, payable_amount: Number(o.payable_amount) });
}
