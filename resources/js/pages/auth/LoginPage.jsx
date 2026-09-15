import React, { useState } from 'react';
import { CalendarCheck, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin, api, Field, Alert, Spinner }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(window.__SESSION_ERROR__ || '');
    const [busy, setBusy] = useState(false);
    async function submit(event) {
        event.preventDefault(); setMessage(''); setErrors({});
        const next = {}; if (!form.email) next.email = 'Email wajib diisi.'; if (!form.password) next.password = 'Kata sandi wajib diisi.';
        if (Object.keys(next).length) return setErrors(next);
        setBusy(true);
        try { onLogin(await api('post', '/login', form)); }
        catch (error) { setMessage(error.message); setErrors(error.errors); }
        finally { setBusy(false); }
    }
    return <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4 sm:px-6"><section className="w-full max-w-[460px]"><form onSubmit={submit} className="w-full rounded-2xl border border-line bg-white px-5 py-8 shadow-lg sm:px-10 sm:py-10" noValidate>
            <div className="mb-8 text-center"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><CalendarCheck size={28}/></div><p className="text-xl font-black text-brand">Technolife</p><p className="text-[11px] font-bold tracking-[.28em] text-neutral">EVENT KALENDER</p><h2 className="mt-8 text-2xl leading-[1.25] font-bold tracking-tight">Selamat Datang Kembali</h2><p className="mx-auto mt-3 max-w-[350px] text-sm leading-6 text-neutral">Silakan masuk untuk melanjutkan ke Event Kalender Technolife</p></div>
            {message && <Alert tone="error">{message}</Alert>}
            <div className="space-y-5"><Field label="Email" error={errors.email}><input autoComplete="username" autoFocus className="field" type="email" value={form.email} aria-invalid={!!errors.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nama@perusahaan.com" /></Field><Field label="Kata sandi" error={errors.password}><input autoComplete="current-password" className="field" type="password" value={form.password} aria-invalid={!!errors.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Masukkan kata sandi" /></Field></div>
            <button disabled={busy} className="btn btn-primary mt-7 min-h-12 w-full">{busy ? <><Spinner/> Memeriksa akun…</> : 'Masuk'}</button>
            <button type="button" onClick={() => { window.location.href = '/auth/keycloak/redirect'; }} className="btn mt-3 min-h-12 w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm cursor-pointer"><ShieldCheck className="w-4 h-4 text-[#d50932]" /><span>Technolife SSO (Keycloak)</span></button>
            <p className="mt-8 text-center text-xs text-neutral">Akses terbatas untuk personel Technolife yang berwenang.</p>
        </form></section></main>;
}
