import crypto from 'crypto';
import { sql } from '@/lib/db';
import { merchantByKey } from '@/lib/auth';

export async function POST(req) {
  const m = await merchantByKey(req);
  if (!m) return Response.json({ error: 'invalid api key' }, { status: 401 });
  if (!m.upi_id) return Response.json({ error: 'set your UPI ID in the dashboard first' }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const amount = Number(b.amount);
  if (!(amount >= 1 && amount <= 100000)) return Response.json({ error: 'amount must be between 1 and 100000' }, { status: 400 });

  await sql`update orders set status = 'expired' where merchant_id = ${m.id} and status = 'pending' and expires_at < now()`;

  const id = 'ord_' + crypto.randomBytes(8).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  let payable = null;
  // find the first free amount: 499.00, 499.01, 499.02 ... (unique among pending orders)
  for (let i = 0; i < 99 && payable === null; i++) {
    const p = (Math.round(amount * 100) + i) / 100;
    const r = await sql`insert into orders (id, merchant_id, order_ref, base_amount, payable_amount, redirect_url, webhook_url, expires_at)
      values (${id}, ${m.id}, ${b.order_ref || null}, ${amount}, ${p}, ${b.redirect_url || null}, ${b.webhook_url || null}, ${expires})
      on conflict do nothing returning id`;
    if (r.length) payable = p;
  }
  if (payable === null) return Response.json({ error: 'too many pending orders for this amount, retry shortly' }, { status: 429 });

  const origin = process.env.APP_URL || new URL(req.url).origin;
  return Response.json({
    order_id: id, status: 'pending', payable_amount: payable, expires_at: expires,
    checkout_url: `${origin}/pay/${id}`,
  });
        }
