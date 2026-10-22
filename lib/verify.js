import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { sql } from './db';
import { decrypt } from './crypto';
import { parsePayment } from './parse';
import { sendWebhook } from './webhook';

// Reads recent Gmail messages and marks matching pending orders as paid.
// Rate-limited per merchant (8s) through the DB so many checkout tabs don't hammer Gmail.
export async function checkMerchant(m) {
  const [lock] = await sql`update merchants set last_check = now()
    where id = ${m.id} and (last_check is null or last_check < now() - interval '8 seconds') returning id`;
  if (!lock) return;

  let pending = await sql`select * from orders where merchant_id = ${m.id} and status = 'pending' and expires_at > now()`;
  if (!pending.length || !m.imap_user || !m.imap_pass_enc) return;

  const client = new ImapFlow({
    host: 'imap.gmail.com', port: 993, secure: true, logger: false,
    auth: { user: m.imap_user, pass: decrypt(m.imap_pass_enc) },
  });

  try {
    await client.connect();
    const box = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const uids = (await client.search({ since, from: m.sender_filter || 'fampay' }, { uid: true })) || [];
      const recent = uids.slice(-25);
      if (!recent.length) return;

      for await (const msg of client.fetch(recent, { source: true, internalDate: true }, { uid: true })) {
        const parsed = await simpleParser(msg.source);
        const p = parsePayment(`${parsed.subject || ''} ${parsed.text || ''}`);
        if (!p) continue;
        const mailTime = new Date(parsed.date || msg.internalDate).getTime();
        const order = pending.find(
          (o) => Math.abs(Number(o.payable_amount) - p.amount) < 0.001 && new Date(o.created_at).getTime() <= mailTime + 60000
        );
        if (!order) continue;
        try {
          const [paid] = await sql`update orders set status = 'paid', utr = ${p.utr}, paid_at = now()
            where id = ${order.id} and status = 'pending' returning *`;
          pending = pending.filter((o) => o.id !== order.id);
          if (paid) await sendWebhook(m, paid);
        } catch (e) { /* duplicate UTR = already used, ignore */ }
      }
    } finally { box.release(); }
  } catch (e) {
    console.error('imap error', e.message);
  } finally {
    await client.logout().catch(() => {});
  }
}
