# PayDesk – UPI payment links with Gmail auto-verification

Next.js 14 + Neon Postgres, deploys on Vercel.

## Setup
1. **Neon**: create a free DB, run `schema.sql` in its SQL editor, copy the connection string.
2. **Gmail**: turn on 2-Step Verification, enable IMAP, create an **App Password** (Google Account → Security → App passwords).
3. **Vercel**: push this folder to GitHub, import it, add env vars from `.env.example`
   (`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `APP_URL`).
4. Register on your site → Dashboard → fill UPI ID, Gmail, App Password.
5. **IMPORTANT**: open one real payment-received email, then edit `lib/parse.js` (amount / UTR / "received" words)
   and the "sender filter" in the dashboard so they match that email.

## API
```
POST /api/v1/orders        (header x-api-key)   body: {amount, order_ref?, redirect_url?, webhook_url?}
GET  /api/v1/orders/:id    (header x-api-key)   -> {status: pending|paid|expired, utr, ...}
```
Webhook (POST JSON, header `x-signature` = HMAC-SHA256(body, webhook_secret)):
`{event:"payment.success", order_id, order_ref, amount, utr, paid_at}`

## How matching works
Each pending order gets a unique payable amount (499.00, 499.01 …). A parsed email matches an order only if
amount is equal, the email is newer than the order, and the UTR was never used (unique in DB).
Verification runs while the checkout page / status API is polled (works on Vercel Hobby, no background worker needed).
