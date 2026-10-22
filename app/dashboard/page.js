'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const r = useRouter();
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState('');
  async function load() {
    const res = await fetch('/api/me');
    if (res.status === 401) return r.push('/login');
    setD(await res.json());
  }
  useEffect(() => { load(); }, []);
  async function save(e) {
    e.preventDefault();
    const res = await fetch('/api/me', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setMsg(res.ok ? 'Saved ✓' : 'Error'); load();
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); r.push('/'); }
  if (!d) return <div className="wrap"><p>Loading…</p></div>;
  return (
    <div className="wrap">
      <nav><b>PayDesk</b><button className="btn ghost" onClick={logout}>Logout</button></nav>
      <div className="grid">
        <div className="card"><h3>API key</h3><code>{d.api_key}</code><p className="muted">Send as <code>x-api-key</code> header</p></div>
        <div className="card"><h3>Webhook secret</h3><code>{d.webhook_secret}</code><p className="muted">HMAC-SHA256 of body = <code>x-signature</code></p></div>
      </div>
      <form className="card" onSubmit={save}>
        <h3>Settings</h3>
        <label>Your UPI ID (where money comes)</label><input name="upi_id" defaultValue={d.upi_id || ''} placeholder="name@fam" />
        <label>Gmail address (receives payment emails)</label><input name="imap_user" defaultValue={d.imap_user || ''} />
        <label>Gmail App Password {d.has_imap_pass && '(saved – leave blank to keep)'}</label><input name="imap_pass" type="password" placeholder="16-character app password" />
        <label>Email sender filter</label><input name="sender_filter" defaultValue={d.sender_filter || 'fampay'} />
        <label>Default webhook URL</label><input name="webhook_url" defaultValue={d.webhook_url || ''} placeholder="https://yoursite.com/webhook" />
        <button className="btn">Save</button> <span className="muted">{msg}</span>
      </form>
      <h3>Recent orders</h3>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table><thead><tr><th>Order</th><th>Ref</th><th>Amount</th><th>Status</th><th>UTR</th></tr></thead>
          <tbody>{d.orders.map((o) => (<tr key={o.id}><td>{o.id}</td><td>{o.order_ref}</td><td>₹{o.payable_amount}</td><td><span className={'pill ' + o.status}>{o.status}</span></td><td>{o.utr}</td></tr>))}</tbody></table>
      </div>
    </div>
  );
    }
    
