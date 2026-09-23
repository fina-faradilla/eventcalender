import React, { useState } from 'react';
import { CalendarCheck, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin, api, Field, Alert, Spinner }) {
    const [form, setForm] = useState({ login: '', password: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(window.__SESSION_ERROR__ || '');
    const [busy, setBusy] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setMessage('');
        setErrors({});
        const next = {};
        if (!form.login) next.login = 'Email, NIK, atau Username wajib diisi.';
        if (!form.password) next.password = 'Kata sandi / PIN wajib diisi.';
        if (Object.keys(next).length) return setErrors(next);
        setBusy(true);
        try {
            onLogin(await api('post', '/login', { ...form, email: form.login }));
        } catch (error) {
            setMessage(error.message);
            setErrors(error.errors || {});
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-canvas px-4 sm:px-6">
            <section className="w-full max-w-[460px]">
                <form onSubmit={submit} className="card w-full rounded-2xl border border-line bg-white px-6 py-8 shadow-md sm:px-10 sm:py-10" noValidate>
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand shadow-sm">
                            <CalendarCheck size={28} />
                        </div>
                        <p className="text-2xl font-bold tracking-tight text-brand">Technolife</p>
                        <p className="text-[11px] font-semibold tracking-[.24em] text-neutral uppercase">Event Kalender</p>
                        <h2 className="mt-8 text-2xl font-bold tracking-tight text-ink">Selamat Datang Kembali</h2>
                        <p className="mx-auto mt-2 max-w-[350px] text-sm leading-6 text-neutral">
                            Silakan masuk untuk melanjutkan ke Event Kalender Technolife
                        </p>
                    </div>

                    {message && <Alert tone="error">{message}</Alert>}

                    <div className="space-y-5">
                        <Field label="Email / NIK / Username" error={errors.login || errors.email}>
                            <input
                                autoComplete="username"
                                autoFocus
                                className="field"
                                type="text"
                                value={form.login}
                                aria-invalid={!!(errors.login || errors.email)}
                                onChange={e => setForm({ ...form, login: e.target.value })}
                                placeholder="Email, NIK (Employee ID), atau Username"
                            />
                        </Field>

                        <Field label="Kata sandi" error={errors.password}>
                            <input
                                autoComplete="current-password"
                                className="field"
                                type="password"
                                value={form.password}
                                aria-invalid={!!errors.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Masukkan kata sandi"
                            />
                        </Field>
                    </div>

                    <button disabled={busy} className="btn btn-primary mt-7 min-h-12 w-full text-sm font-semibold">
                        {busy ? <><Spinner /> Memeriksa akun…</> : 'Masuk'}
                    </button>
                    <button
                        type="button"
                        onClick={() => { window.location.href = '/auth/keycloak/redirect'; }}
                        className="btn btn-secondary mt-3 min-h-12 w-full gap-2 text-sm font-semibold"
                    >
                        <ShieldCheck className="h-4 w-4 text-brand" />
                        <span>Technolife SSO (Keycloak)</span>
                    </button>
                    <p className="mt-8 text-center text-xs text-neutral">
                        Akses terbatas untuk personel Technolife yang berwenang.
                    </p>
                </form>
            </section>
        </main>
    );
}
