import React, { useContext, useState } from 'react';
import { ChevronRight, ClipboardCheck, Plus, Search, X, Users, Building2, MapPin, CalendarDays, CalendarCheck, BarChart3 } from 'lucide-react';
export default function createAdminPages(deps) {
    const { useResource, SessionContext, PageHeader, ListToolbar, SearchField, Field, Alert, Spinner, Modal, EmptyState, ErrorState, TableSkeleton, ListSkeleton, StatusBadge, Info, api, ToastContext, ROLE, STATUS, EventDetail, EventForm, EventTable, DashboardHero, StatCard, Dashboard, filterDashboardEvents, sortDashboardEvents, dashboardMetricConfigurations, dateText, dateTimeText, timeText, uiText, Avatar, OperationalChart } = deps;function UserManagement({ staffOnly }) {
    const resource = useResource('/users'); const [editing, setEditing] = useState(null); const [query, setQuery] = useState(''); const rows = (resource.data || []).filter(user => (!staffOnly || user.role === 'STAFF') && (!query || `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())));
    return <><PageHeader title={staffOnly ? 'Manajemen Staf' : 'Manajemen Pengguna'} subtitle={staffOnly ? 'Kelola direktori, peran, dan penugasan acara anggota tim internal.' : 'Kelola akun administrator, penyetuju, PIC, dan staf.'} action={<button className="btn btn-primary" onClick={() => setEditing({ role: staffOnly ? 'STAFF' : 'PIC', is_active: true })}><Plus size={17}/>Tambah {staffOnly ? 'Staf Baru' : 'Pengguna'}</button>}/><section className="card mb-6"><ListToolbar single><SearchField className="max-w-lg" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Cari ${staffOnly ? 'staf' : 'pengguna'} berdasarkan nama atau email...`}/></ListToolbar></section><section className="card overflow-hidden">{resource.loading ? <TableSkeleton/> : resource.error ? <ErrorState compact retry={resource.reload}/> : rows.length ? <div className="mobile-scroll"><table className="data-table w-full min-w-[760px] text-sm"><thead><tr><th>{staffOnly ? 'Anggota Staf' : 'Nama Pengguna'}</th><th>Email</th><th>Peran</th><th>Status</th><th>Dibuat</th><th className="text-right">Aksi</th></tr></thead><tbody>{rows.map(user => <tr className="table-row" key={user.id}><td><div className="flex items-center gap-3"><Avatar name={user.name}/><b>{user.name}</b></div></td><td className="text-neutral">{user.email}</td><td><span className="badge badge-neutral">{ROLE[user.role]}</span></td><td><span className={`badge ${user.is_active ? 'badge-approved' : 'badge-rejected'}`}>{user.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td>{dateText(user.created_at?.slice(0, 10))}</td><td className="text-right"><button className="btn btn-secondary min-h-8 px-3 py-1 text-xs" onClick={() => setEditing(user)}>Edit</button></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title={`${staffOnly ? 'Staf' : 'Pengguna'} tidak ditemukan`} description={query ? 'Coba kata pencarian lain.' : 'Tambahkan akun internal untuk memulai.'}/>}</section>{editing && <UserForm user={editing} lockStaff={staffOnly} close={() => setEditing(null)} done={() => { setEditing(null); resource.reload(); }}/>}</>;
}

function UserForm({ user, lockStaff, close, done }) {
    const creating = !user.id; const [form, setForm] = useState({ name: user.name || '', email: user.email || '', role: lockStaff ? 'STAFF' : user.role || 'PIC', phone: user.phone || '', password: '', is_active: user.is_active ?? true }); const [busy, setBusy] = useState(false); const [errors, setErrors] = useState({}); const [message, setMessage] = useState(''); const toast = useContext(ToastContext);
    async function submit() { setBusy(true); setMessage(''); setErrors({}); try { await api('post', `/users${user.id ? `/${user.id}` : ''}`, form); toast(`Pengguna berhasil ${creating ? 'ditambahkan' : 'diperbarui'}.`); done(); } catch (error) { setErrors(error.errors); setMessage(error.message); } finally { setBusy(false); } }
    return <Modal title={creating ? 'Tambah pengguna' : 'Edit pengguna'} close={close} size="sm">{message && <Alert tone="error">{message}</Alert>}<div className="space-y-4"><Field label="Nama" error={errors.name}><input className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Field><Field label="Email" error={errors.email}><input type="email" className="field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></Field><Field label="Peran" error={errors.role}><select disabled={lockStaff} className="field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{Object.entries(ROLE).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Nomor telepon" error={errors.phone}><input className="field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/></Field><Field label={creating ? 'Kata sandi awal' : 'Kata sandi baru (opsional)'} error={errors.password}><input type="password" autoComplete="new-password" className="field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></Field><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}/>Akun aktif</label></div><div className="mt-6 flex justify-end gap-2"><button className="btn btn-secondary" onClick={close}>Batal</button><button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Menyimpan…' : 'Simpan'}</button></div></Modal>;
}

function VenueManagement() {
    const resource = useResource('/venues'); const [editing, setEditing] = useState(null);
    const rows = resource.data || []; const totalCapacity = rows.reduce((sum, venue) => sum + Number(venue.capacity || 0), 0);
    return <><PageHeader title="Manajemen Lokasi" subtitle="Kelola fasilitas, pantau ketersediaan, dan lacak status operasional." action={<button className="btn btn-primary" onClick={() => setEditing({ is_active: true })}><Plus size={17}/>Tambah Lokasi Baru</button>}/>
        {!resource.loading && !resource.error && <div className="stats-grid mb-6"><StatCard label="Total Lokasi" count={rows.length}/><StatCard label="Aktif" count={rows.filter(v => v.is_active).length}/><StatCard label="Nonaktif" count={rows.filter(v => !v.is_active).length}/><StatCard label="Total Kapasitas" count={totalCapacity.toLocaleString('id-ID')}/></div>}
        <section className="card overflow-hidden">{resource.loading ? <TableSkeleton/> : resource.error ? <ErrorState retry={resource.reload}/> : rows.length ? <div className="mobile-scroll"><table className="data-table w-full min-w-[760px] text-sm"><thead><tr><th>Nama Lokasi</th><th>Alamat</th><th>Kapasitas</th><th>Status</th><th className="text-right">Aksi</th></tr></thead><tbody>{rows.map(venue => <tr key={venue.id} className="table-row"><td><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><Building2 size={19}/></span><span><b className="block">{venue.name}</b><span className="text-xs text-neutral">{venue.type || 'Ruang acara'}</span></span></div></td><td>{venue.location || '—'}</td><td>{venue.capacity?.toLocaleString('id-ID') || '—'}</td><td><span className={`badge ${venue.is_active ? 'badge-approved' : 'badge-rejected'}`}>{venue.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td className="text-right"><button className="btn btn-secondary min-h-8 px-3 py-1 text-xs" onClick={() => setEditing(venue)}>Edit</button></td></tr>)}</tbody></table></div> : <EmptyState icon={MapPin} title="Lokasi tidak ditemukan" description="Tambahkan lokasi agar tersedia untuk reservasi acara."/>}</section>
        {editing && <VenueForm venue={editing} close={() => setEditing(null)} done={() => { setEditing(null); resource.reload(); }}/>}</>;
}

function VenueForm({ venue, close, done }) {
    const [form, setForm] = useState({ name: venue.name || '', type: venue.type || '', location: venue.location || '', capacity: venue.capacity || '', is_active: venue.is_active ?? true }); const [message, setMessage] = useState(''); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const toast = useContext(ToastContext);
    async function submit() { setBusy(true); try { await api('post', `/venues${venue.id ? `/${venue.id}` : ''}`, form); toast('Data lokasi berhasil disimpan.'); done(); } catch (error) { setErrors(error.errors); setMessage(error.message); } finally { setBusy(false); } }
    return <Modal title={venue.id ? 'Edit lokasi' : 'Tambah lokasi'} close={close} size="sm">{message && <Alert tone="error">{message}</Alert>}<div className="space-y-4"><Field label="Nama lokasi" error={errors.name}><input className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Field><Field label="Tipe lokasi" error={errors.type}><input className="field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Ruang pertemuan, aula, area pameran…"/></Field><Field label="Alamat" error={errors.location}><input className="field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></Field><Field label="Kapasitas" error={errors.capacity}><input type="number" min="1" className="field" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}/></Field><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}/>Lokasi aktif</label></div><div className="mt-6 flex justify-end gap-2"><button className="btn btn-secondary" onClick={close}>Batal</button><button className="btn btn-primary" disabled={busy} onClick={submit}>Simpan</button></div></Modal>;
}

function Reports() {
    const resource = useResource('/dashboard'); const eventsResource = useResource('/events?per_page=50');
    if (resource.loading || eventsResource.loading) return <PageSkeleton cards={4}/>; if (resource.error || eventsResource.error) return <ErrorState retry={() => { resource.reload(); eventsResource.reload(); }}/>; const d = resource.data; const events = eventsResource.data?.data || [];
    return <><PageHeader title="Laporan Operasional" subtitle="Ringkasan kinerja acara berdasarkan data terkini."/><div className="stats-grid"><StatCard label="Total Acara" count={d.total}/><StatCard label="Acara Selesai" count={d.completed}/><StatCard label="Sedang Berlangsung" count={d.ongoing} accent/><StatCard label="Acara Mendatang" count={d.upcoming}/></div><OperationalAnalytics events={events}/></>;
}

function OperationalAnalytics({ events }) {
    const anchor = new Date();
    anchor.setDate(1);
    const series = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(anchor.getFullYear(), anchor.getMonth() - 6 + index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthEvents = (events || []).filter(event => event.event_date?.startsWith(key));
        const totalParticipants = monthEvents.reduce((sum, e) => sum + Number(e.participants_count || 0), 0);
        return {
            key,
            label: date.toLocaleDateString('id-ID', { month: 'short' }),
            fullLabel: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            value: monthEvents.length,
            events: monthEvents.length,
            participants: totalParticipants,
        };
    });
    const usage = Object.values((events || []).reduce((result, event) => {
        const name = event.venue?.name || event.custom_venue || 'Belum ditentukan';
        result[name] ||= { name, value: 0 };
        result[name].value++;
        return result;
    }, {})).sort((a, b) => b.value - a.value).slice(0, 4);
    const usageMax = Math.max(1, ...usage.map(item => item.value));

    return (
        <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="section-title">Volume Acara & Total Pengunjung</h2>
                        <p className="mt-1 text-sm text-neutral">Statistik perbandingan jumlah acara dan total pengunjung per bulan</p>
                    </div>
                    <span className="badge badge-neutral">7 Bulan Terakhir</span>
                </div>
                <OperationalChart series={series} />
            </div>
            <aside className="card p-6">
                <h2 className="section-title">Penggunaan Lokasi</h2>
                <p className="mt-1 text-sm text-neutral">Pemesanan berdasarkan lokasi</p>
                <div className="report-bars mt-7">
                    {usage.map(item => (
                        <div key={item.name}>
                            <div className="mb-2 flex justify-between gap-3 text-sm">
                                <b className="truncate">{item.name}</b>
                                <span>{item.value} acara</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
                                <span className="block h-full rounded-full bg-brand" style={{ width: `${(item.value / usageMax) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                    {!usage.length && <p className="text-sm text-neutral">Data penggunaan lokasi belum tersedia.</p>}
                </div>
            </aside>
        </section>
    );
}
    return { UserManagement, UserForm, VenueManagement, VenueForm, Reports, OperationalAnalytics };
}
