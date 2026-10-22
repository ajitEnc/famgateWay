'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthForm({ mode }) {
  const r = useRouter();
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    const d = await res.json();
    if (res.ok) r.push('/dashboard'); else setErr(d.error);
  }
  return (
    <form className="narrow card" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      <label>Email</label><input name="email" type="email" required />
      <label>Password</label><input name="password" type="password" required minLength={8} />
      {err && <p style={{ color: '#f87171' }}>{err}</p>}
      <button className="btn" style={{ width: '100%' }}>{mode === 'login' ? 'Sign in' : 'Register'}</button>
      <p className="muted"><Link href={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Need an account?' : 'Already have one?'}</Link></p>
    </form>
  );
}
