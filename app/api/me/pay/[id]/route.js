import { sql } from '@/lib/db';
import { checkMerchant } from '@/lib/verify';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Public endpoint used by the checkout page. Each poll also triggers a (rate-limited) Gmail check.
export async function GET(req, { params }) {
  let [o] = await sql`select o.*, m.upi_id, m.email from orders o join merchants m on m.id = o.merchant_id where o.id = ${params.id}`;
  if (!o) return Response.json({ error: 'not found' }, { status: 404 });

  if (o.status === 'pending') {
    if (new Date(o.expires_at) < new Date()) {
      await sql`update orders set status = 'expired' where id = ${o.id} and status = 'pending'`;
      o.status = 'expired';
    } else {
      const [m] = await sql`select * from merchants where id = ${o.merchant_id}`;
      await checkMerchant(m);
      [o] = await sql`select o.*, m.upi_id, m.email from orders o join merchants m on m.id = o.merchant_id where o.id = ${params.id}`;
    }
  }

  const amt = Number(o.payable_amount).toFixed(2);
  return Response.json({
    status: o.status, amount: amt, expires_at: o.expires_at, redirect_url: o.redirect_url,
    upi_link: `upi://pay?pa=${encodeURIComponent(o.upi_id)}&pn=${encodeURIComponent('Merchant')}&am=${amt}&cu=INR&tn=${o.id}`,
  });
}
