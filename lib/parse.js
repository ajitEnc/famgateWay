// !!! Adjust these after looking at ONE real payment email in your Gmail !!!
// Only emails that look like "money received" are accepted, so that payments YOU make don't match.
const RECEIVED_HINT = /received|credited|paid you|sent you/i;

export function parsePayment(text) {
  const t = text.replace(/\s+/g, ' ');
  if (!RECEIVED_HINT.test(t)) return null;
  const a = t.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const u =
    t.match(/(?:UTR|UPI\s*Ref(?:erence)?(?:\s*(?:No|ID|Number))?|Ref(?:erence)?\s*(?:No|ID|Number)?|Txn\s*ID)\s*[:#.-]?\s*(\d{9,18})/i) ||
    t.match(/\b(\d{12})\b/);
  if (!a || !u) return null;
  return { amount: parseFloat(a[1].replace(/,/g, '')), utr: u[1] };
}
