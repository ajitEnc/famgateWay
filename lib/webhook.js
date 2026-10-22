import crypto from 'crypto';

export async function sendWebhook(merchant, order) {
  const url = order.webhook_url || merchant.webhook_url;
  if (!url) return;
  const body = JSON.stringify({
    event: 'payment.success',
    order_id: order.id,
    order_ref: order.order_ref,
    amount: Number(order.payable_amount),
    utr: order.utr,
    paid_at: order.paid_at,
  });
  const sig = crypto.createHmac('sha256', merchant.webhook_secret).update(body).digest('hex');
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-signature': sig },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) { console.error('webhook failed', e.message); }
}
