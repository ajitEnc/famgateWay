import Link from 'next/link';
export default function Home() {
  return (
    <div className="wrap">
      <nav><b>PayDesk</b><div><Link href="/login" className="btn ghost">Sign in</Link> <Link href="/register" className="btn">Get API key</Link></div></nav>
      <section className="hero">
        <h1>Accept UPI payments. Know the moment they arrive.</h1>
        <p>Create an order, show a UPI QR, and get a signed webhook as soon as the payment lands. Two API calls, clean JSON.</p>
        <p><Link href="/register" className="btn">Create free account →</Link></p>
      </section>
      <div className="grid">
        <div className="card"><h3>1. Create order</h3><p>Send an amount, get a checkout link and a unique payable amount.</p></div>
        <div className="card"><h3>2. Customer pays</h3><p>Hosted checkout with QR and a one-tap UPI app button.</p></div>
        <div className="card"><h3>3. Auto verify</h3><p>Payment email is matched by amount and UTR. Webhook fires once.</p></div>
      </div>
      <pre>{`curl -X POST $APP_URL/api/v1/orders \\
  -H "x-api-key: pd_xxx" -H "content-type: application/json" \\
  -d '{"amount": 499, "order_ref": "INV-101", "redirect_url": "https://you.com/thanks"}'

# -> { "order_id": "ord_...", "payable_amount": 499.00, "checkout_url": "..." }`}</pre>
    </div>
  );
}
