'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';

export default function Pay() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [qr, setQr] = useState('');

  useEffect(() => {
    let stop = false;
    async function poll() {
      const res = await fetch(`/api/pay/${id}`);
      if (res.ok) {
        const d = await res.json();
        setO(d);
        if (d.status === 'paid' && d.redirect_url) setTimeout(() => (location.href = d.redirect_url), 2000);
        if (d.status !== 'pending') return;
      }
      if (!stop) setTimeout(poll, 4000);
    }
    poll();
    return () => { stop = true; };
  }, [id]);

  useEffect(() => { if (o?.upi_link && !qr) QRCode.toDataURL(o.upi_link, { width: 480 }).then(setQr); }, [o, qr]);

  if (!o) return <div className="pay"><p>Loading…</p></div>;
  return (
    <div className="pay card">
      {o.status === 'paid' && <><div className="ok">✓ Payment received</div><p className="muted">Thank you!</p></>}
      {o.status === 'expired' && <p>This payment link has expired.</p>}
      {o.status === 'pending' && (<>
        <div className="muted">Pay exactly</div>
        <div className="amt">₹{o.amount}</div>
        {qr && <img src={qr} alt="UPI QR" />}
        <p><a className="btn" href={o.upi_link}>Open UPI app</a></p>
        <p className="muted">Pay the exact amount shown. Waiting for payment…</p>
      </>)}
    </div>
  );
        }
       
