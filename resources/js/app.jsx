import React, { Component, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
    Bell, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck,
    LayoutDashboard, LogOut, MapPin, Menu, Plus, Search, ShieldCheck,
    UserCircle, Users, X, Building2, CalendarCheck, Settings,
} from 'lucide-react';
import '../css/app.css';
import AvailabilityGrid from './components/AvailabilityGrid';
import OperationalChart from './components/OperationalChart';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name=csrf-token]')?.content;

const SessionContext = createContext(null);
const ToastContext = createContext(() => {});
const STATUS = {
    DRAFT: 'Draf', PENDING_APPROVAL: 'Menunggu Persetujuan', APPROVED: 'Disetujui',
    REJECTED: 'Ditolak', SCHEDULED: 'Terjadwal', ONGOING: 'Sedang Berlangsung',
    COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan',
};
const ROLE = { PIC: 'PIC', APPROVER: 'Penyetuju', ADMIN: 'Admin', STAFF: 'Staf' };
const UI_TEXT = {
    'Kalender Event': 'Kalender Acara',
    'Jadwal event yang telah disetujui dan terkonfirmasi.': 'Jadwal acara yang telah disetujui dan terkonfirmasi.',
    'Belum ada event terjadwal': 'Belum ada acara terjadwal',
    'Event akan muncul setelah disetujui.': 'Acara akan muncul setelah disetujui.',
    'Deskripsi event': 'Deskripsi acara',
};
const uiText = text => UI_TEXT[text] || text;

async function api(method, url, data) {
    try { return (await axios({ method, url: `/api${url}`, data })).data; }
    catch (error) {
        const status = error.response?.status;
        if (status === 401 || status === 419) window.dispatchEvent(new CustomEvent('session-expired'));
        const validation = Object.values(error.response?.data?.errors || {})[0]?.[0];
        const message = status === 403 ? 'Anda tidak memiliki akses ke halaman ini.'
            : status === 419 || status === 401 ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
            : error.response?.data?.message || validation || 'Data gagal diproses. Silakan coba kembali.';
        const wrapped = new Error(message); wrapped.status = status; wrapped.errors = error.response?.data?.errors || {};
        throw wrapped;
    }
}

const dateText = value => value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '—';
const dateTimeText = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const timeText = value => value?.slice(0, 5) || '—';

function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const show = (message, tone = 'success') => {
        const id = Date.now(); setItems(current => [...current, { id, message, tone }]);
        setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 3500);
    };
    return <ToastContext.Provider value={show}>{children}<div className="fixed right-4 top-4 z-[80] space-y-2 w-[calc(100%-2rem)] max-w-sm">{items.map(item => <div key={item.id} className={`toast card border-l-4 p-4 shadow-lg ${item.tone === 'error' ? 'border-l-brand' : 'border-l-neutral'}`}><p className="text-sm font-semibold">{item.message}</p></div>)}</div></ToastContext.Provider>;
}

class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error, details) {
        if (window.__APP_DEBUG__) console.error('React render failed:', error, details);
    }

    render() {
        if (this.state.failed) {
            return <main className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-lg font-bold">Aplikasi gagal dimuat.</h1><p className="mt-2 text-sm text-neutral">Muat ulang halaman atau periksa koneksi Anda.</p></div></main>;
        }

        return this.props.children;
    }
}

function Login({ onLogin }) {
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
    return <main className="min-h-screen grid lg:grid-cols-[1.08fr_.92fr] bg-white">
        <section className="relative overflow-hidden bg-ink text-white p-8 sm:p-12 lg:p-20 flex min-h-[330px] lg:min-h-screen flex-col justify-between">
            <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full border-[55px] border-white/[.035]" />
            <div className="relative flex items-center gap-3"><div className="h-9 w-1.5 bg-brand"/><b className="text-xl tracking-[.12em]"><span className="text-brand">TECHNO</span>LIFE</b></div>
            <div className="relative max-w-2xl py-10"><p className="text-brand text-sm font-extrabold tracking-[.22em]">OPERASIONAL ACARA</p><h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08]">Agenda yang rapi.<br/>Tim yang siap.</h1><p className="mt-6 max-w-xl text-base sm:text-lg leading-8 text-white/60">Kelola reservasi, persetujuan, jadwal, dan pengingat acara dalam satu ruang kerja.</p></div>
            <p className="relative text-xs uppercase tracking-[.18em] text-white/35">Sistem Manajemen Acara Internal</p>
        </section>
        <section className="flex items-center justify-center bg-canvas px-5 py-12 sm:px-10"><form onSubmit={submit} className="w-full max-w-md" noValidate>
            <div className="mb-8"><p className="text-sm font-extrabold tracking-wide text-brand">Selamat datang</p><h2 className="mt-2 text-3xl font-black tracking-tight">Masuk ke akun</h2><p className="mt-2 text-sm leading-6 text-neutral">Gunakan akun perusahaan Anda untuk melanjutkan.</p></div>
            {message && <Alert tone="error">{message}</Alert>}
            <div className="space-y-5"><Field label="Email" error={errors.email}><input autoComplete="username" autoFocus className="field" type="email" value={form.email} aria-invalid={!!errors.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nama@perusahaan.com" /></Field><Field label="Kata sandi" error={errors.password}><input autoComplete="current-password" className="field" type="password" value={form.password} aria-invalid={!!errors.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Masukkan kata sandi" /></Field></div>
            <button disabled={busy} className="btn btn-primary mt-7 w-full">{busy ? <><Spinner/> Memeriksa akun…</> : 'Masuk'}</button>
            <button
    type="button"
    onClick={() => {
        window.location.href = '/auth/keycloak/redirect';
    }}
    className="btn w-full flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
>
    <ShieldCheck className="w-4 h-4 text-[#d50932]" />
    <span>Technolife SSO (Keycloak)</span>
</button>
            <p className="mt-8 text-center text-xs text-neutral">Akses terbatas untuk personel Technolife yang berwenang.</p>
        </form></section>
    </main>;
}

const navigation = {
    PIC: [['dashboard', 'Dasbor', LayoutDashboard], ['events', 'Acara Saya', ClipboardCheck], ['calendar', 'Kalender Acara', CalendarDays], ['venue-availability', 'Ketersediaan Lokasi', Building2], ['staff-availability', 'Ketersediaan Staf', CalendarCheck], ['notifications', 'Notifikasi', Bell]],
    APPROVER: [['dashboard', 'Dasbor', LayoutDashboard], ['pending', 'Antrean Persetujuan', ShieldCheck], ['calendar', 'Kalender Acara', CalendarDays], ['notifications', 'Notifikasi', Bell]],
    ADMIN: [['dashboard', 'Dasbor', LayoutDashboard], ['events', 'Manajemen Acara', ClipboardCheck], ['calendar', 'Kalender Acara', CalendarDays], ['venue-availability', 'Ketersediaan Lokasi', Building2], ['staff-availability', 'Ketersediaan Staf', CalendarCheck], ['venues', 'Manajemen Lokasi', MapPin], ['staff', 'Manajemen Staf', UserCircle], ['users', 'Manajemen Pengguna', Users], ['notifications', 'Notifikasi', Bell]],
    STAFF: [['dashboard', 'Dasbor', LayoutDashboard], ['assignments', 'Penugasan Saya', ClipboardCheck], ['calendar', 'Kalender Acara', CalendarDays], ['notifications', 'Notifikasi', Bell]],
};

const roleBranding = {
    ADMIN: { title: 'Technolife Admin', subtitle: 'Konsol Admin' },
    APPROVER: { title: 'Technolife Penyetuju', subtitle: 'Konsol Persetujuan' },
    PIC: { title: 'Technolife PIC', subtitle: 'Konsol PIC' },
    STAFF: { title: 'Technolife Staf', subtitle: 'Konsol Staf' },
};
const brandingFor = role => roleBranding[String(role ?? '').trim().toUpperCase()] || { title: 'Technolife', subtitle: 'Manajemen Acara' };

const staffRoutes = { dashboard: '/staff/dashboard', assignments: '/staff/assignments', calendar: '/staff/calendar', notifications: '/staff/notifications', settings: '/staff/settings' };
const staffPageFromPath = () => location.pathname === '/staff/profile' ? 'settings' : Object.entries(staffRoutes).find(([, path]) => location.pathname === path)?.[0] || 'dashboard';

function Shell({ user, setUser }) {
    const roleKey = String(user?.role ?? '').trim().toUpperCase();
    const [page, setPageState] = useState(roleKey === 'STAFF' ? staffPageFromPath() : 'dashboard'); const [drawer, setDrawer] = useState(false); const [profile, setProfile] = useState(false); const toast = useContext(ToastContext);
    const notificationResource = useResource(roleKey === 'STAFF' ? '/staff/notifications' : '/notifications');
    useEffect(() => { const timer = window.setInterval(notificationResource.reload, 45000); return () => window.clearInterval(timer); }, []);
    const setPage = next => { setPageState(next); if (roleKey === 'STAFF' && staffRoutes[next]) history.pushState(null, '', staffRoutes[next]); };
    useEffect(() => { const expired = () => { setUser(null); toast('Sesi Anda telah berakhir. Silakan masuk kembali.', 'error'); }; window.addEventListener('session-expired', expired); return () => window.removeEventListener('session-expired', expired); }, []);
    useEffect(() => { if (roleKey !== 'STAFF') return; if (location.pathname === '/') history.replaceState(null, '', staffRoutes.dashboard); if (location.pathname === '/staff/profile') history.replaceState(null, '', staffRoutes.settings); const pop = () => { if (location.pathname === '/staff/profile') history.replaceState(null, '', staffRoutes.settings); setPageState(staffPageFromPath()); }; window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop); }, [roleKey]);
    useEffect(() => { const closeOnEscape = event => event.key === 'Escape' && setDrawer(false); window.addEventListener('keydown', closeOnEscape); document.body.style.overflow = drawer ? 'hidden' : ''; return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; }; }, [drawer]);
    async function logout() { try { await api('post', '/logout'); } finally { setUser(null); history.replaceState(null, '', '/'); } }
    const current = ['profile', 'settings'].includes(page) ? 'Pengaturan' : navigation[roleKey]?.find(item => item[0] === page)?.[1] || 'Dasbor';
    const branding = brandingFor(roleKey);
    return <div className="min-h-screen lg:flex">
        <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col px-4 py-8 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex min-h-14 items-center justify-between"><div className="brand-lockup"><span className="brand-mark">T</span><div><b className="block font-bold text-white">{branding.title}</b><span className="text-[11px] text-white/45">{branding.subtitle}</span></div></div><button aria-label="Tutup menu" className="text-white/70 lg:hidden" onClick={() => setDrawer(false)}><X/></button></div>
            <nav className="mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Navigasi utama">{(navigation[roleKey] || []).map(([id, label, Icon]) => <button key={id} onClick={() => { setPage(id); setDrawer(false); }} className={`nav-item ${page === id ? 'is-active' : ''}`}><Icon size={19}/><span>{label}</span></button>)}</nav>
            <div className="border-t border-white/10 pt-4"><button onClick={() => { setPage(roleKey === 'STAFF' ? 'settings' : 'profile'); setDrawer(false); }} className={`nav-item ${page === (roleKey === 'STAFF' ? 'settings' : 'profile') ? 'is-active' : ''}`}><Settings size={18}/>Pengaturan</button><button onClick={logout} className="nav-item"><LogOut size={18}/>Keluar</button></div>
        </aside>
        {drawer && <button aria-label="Tutup menu" className="fixed inset-0 z-30 bg-black/55 lg:hidden" onClick={() => setDrawer(false)}/>} 
        <section className="min-w-0 flex-1"><header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between px-4 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button aria-label="Buka menu" className="mobile-menu-toggle icon-button" onClick={() => setDrawer(true)}><Menu/></button><div className="min-w-0"><p className="truncate text-[11px] font-bold uppercase tracking-[.12em] text-brand">{branding.subtitle}</p><h2 className="truncate text-sm font-bold sm:text-base">{current}</h2></div></div><div className="flex items-center gap-2 sm:gap-3"><button aria-label="Notifikasi" className="icon-button relative" onClick={() => setPage('notifications')}><Bell size={20}/>{notificationResource.data?.unread_count > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{notificationResource.data.unread_count}</span>}</button><span className="mx-1 hidden h-7 w-px bg-line sm:block"/><button onClick={() => roleKey === 'STAFF' ? setPage('settings') : setProfile(true)} className="flex items-center gap-3 text-left"><span className="hidden sm:block"><b className="block text-right text-sm">{user.name}</b><span className="block text-right text-xs text-neutral">{ROLE[roleKey] || 'Pengguna'}</span></span><Avatar name={user.name}/></button></div></header>
            <main className="mx-auto max-w-[1440px] p-4 sm:p-6 md:p-8"><Page page={page} role={roleKey} navigate={setPage} notificationsChanged={notificationResource.reload}/></main>
        </section>
        {profile && <Modal title="Profil pengguna" close={() => setProfile(false)} size="sm"><div className="flex items-center gap-4 border-b border-line pb-5"><Avatar name={user.name} large/><div><h3 className="text-lg font-black">{user.name}</h3><span className="badge">{ROLE[roleKey] || 'Pengguna'}</span></div></div><dl className="mt-5 space-y-4 text-sm"><Info label="Email" value={user.email}/><Info label="Nomor telepon" value={user.phone || 'Belum diatur'}/><Info label="Status akun" value={user.is_active ? 'Aktif' : 'Nonaktif'}/></dl><div className="mt-6 flex justify-end"><button className="btn btn-danger" onClick={logout}><LogOut size={17}/>Keluar dari sistem</button></div></Modal>}
    </div>;
}

function Page(props) {
    if (props.page === 'dashboard') return props.role === 'STAFF' ? <StaffDashboard {...props}/> : <Dashboard {...props}/>;
    if (props.page === 'assignments') return <StaffAssignments {...props}/>;
    if (['events', 'pending', 'schedule'].includes(props.page)) return <EventList {...props}/>;
    if (props.page === 'calendar') return <CalendarPage/>;
    if (props.page === 'venue-availability') return <AvailabilityPage mode="venue"/>;
    if (props.page === 'staff-availability') return <AvailabilityPage mode="staff"/>;
    if (props.page === 'notifications') return <Notifications notificationsChanged={props.notificationsChanged}/>;
    if (['users', 'staff'].includes(props.page)) return <UserManagement staffOnly={props.page === 'staff'}/>;
    if (props.page === 'venues') return <VenueManagement/>;
    if (props.page === 'reports') return <Reports/>;
    if (['profile', 'settings'].includes(props.page)) return <ProfilePage/>;
}

function Dashboard({ role, navigate }) {
    const [detailId, setDetailId] = useState(null);
    const [dashboardFilter, setDashboardFilter] = useState(role === 'PIC' ? 'upcoming' : role === 'APPROVER' ? 'pending' : 'all');
    const resource = useResource('/dashboard');
    const eventResource = useResource('/events?per_page=50');
    if (resource.loading || eventResource.loading) return <PageSkeleton cards={4}/>;
    if (resource.error || eventResource.error) return <ErrorState retry={() => { resource.reload(); eventResource.reload(); }}/>;
    const d = resource.data;
    const configurations = dashboardMetricConfigurations(role, d);
    const actionPage = role === 'APPROVER' ? 'pending' : role === 'STAFF' ? 'schedule' : 'events';
    const dashboardEvents = eventResource.data?.data || [];
    const activeConfiguration = configurations.find(item => item.key === dashboardFilter) || configurations[0];
    const events = sortDashboardEvents(filterDashboardEvents(dashboardEvents, activeConfiguration.key), activeConfiguration.key).slice(0, 5);
    if (detailId) return <EventDetail fullPage id={detailId} role={role} close={() => setDetailId(null)} edit={() => { setDetailId(null); navigate('events'); }} changed={() => { eventResource.reload(); resource.reload(); }} backLabel={role === 'APPROVER' ? 'Kembali ke Dasbor Persetujuan' : 'Kembali ke Dasbor'}/>;
    const title = role === 'APPROVER' ? 'Ringkasan Persetujuan' : role === 'PIC' ? 'Ringkasan Acara' : 'Ringkasan Dasbor';
    const subtitle = role === 'APPROVER' ? 'Tinjau dan kelola pengajuan yang menunggu keputusan.' : role === 'PIC' ? 'Pantau perkembangan acara Anda hari ini.' : 'Ringkasan kinerja sistem dan metrik acara berdasarkan data terkini.';
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return <>
        <DashboardHero eyebrow="Ruang Kerja Technolife" description={`${subtitle} Kelola agenda dan operasional acara dari satu tempat.`} actionLabel={role === 'APPROVER' ? 'Buka Antrean Persetujuan' : role === 'PIC' ? 'Lihat Acara Saya' : 'Lihat Aktivitas'} onAction={() => navigate(actionPage)} date={today}/>
        <section className={role === 'PIC' ? 'pic-stats-grid' : 'stats-grid'}>{configurations.map(item => <StatCard key={item.key} label={item.label} count={item.count} active={dashboardFilter === item.key} onClick={() => setDashboardFilter(item.key)}/>)}</section>
        <section className="mt-6"><div className="card overflow-hidden"><div className="section-heading"><div><h2>{activeConfiguration.title}</h2><p>{activeConfiguration.description}</p></div><button className="text-button" onClick={() => navigate(actionPage)}>Lihat semua <ChevronRight size={16}/></button></div>{events.length ? <EventTable rows={events} open={setDetailId}/> : <EmptyState icon={ClipboardCheck} title={activeConfiguration.empty} description="Pilih kategori lain atau buka daftar lengkap untuk melihat acara lainnya."/>}</div></section>
        {role === 'ADMIN' && <OperationalAnalytics events={dashboardEvents}/>} 
    </>;
}

function StaffDashboard({ navigate }) {
    const { user } = useContext(SessionContext);
    const [dashboardFilter, setDashboardFilter] = useState('today');
    const resource = useResource('/staff/dashboard');
    const assignmentsResource = useResource('/staff/assignments?per_page=50&filter=all');
    if (resource.loading || assignmentsResource.loading) return <StaffDashboardSkeleton/>;
    if (resource.error || assignmentsResource.error) return <StaffError retry={() => { resource.reload(); assignmentsResource.reload(); }}/>;
    const { stats, schedule, notifications } = resource.data;
    const configurations = staffMetricConfigurations(stats);
    const activeConfiguration = configurations.find(item => item.key === dashboardFilter);
    const assignments = assignmentsResource.data?.data || schedule;
    const filteredAssignments = sortDashboardEvents(filterDashboardEvents(assignments, dashboardFilter), dashboardFilter).slice(0, 5);
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return <><DashboardHero eyebrow="Ruang Kerja Staf" description="Pantau penugasan, jadwal, dan aktivitas acara Anda dari satu tempat." actionLabel="Lihat Penugasan" onAction={() => navigate('assignments')} date={today}/>
        <section className="stats-grid">
            {configurations.map(item => <StatCard key={item.key} label={item.label} count={item.count} active={dashboardFilter === item.key} onClick={() => setDashboardFilter(item.key)}/>)}
        </section>
        <section className="staff-dashboard-grid mt-6">
            <div className="card overflow-hidden"><div className="section-heading"><div><h2>{activeConfiguration.title}</h2><p>Agenda acara sesuai kategori yang dipilih.</p></div><button className="text-button" onClick={() => navigate('assignments')}>Lihat Semua <ChevronRight size={15}/></button></div>{filteredAssignments.length ? <StaffScheduleTable rows={filteredAssignments} open={() => navigate('assignments')}/> : <EmptyState icon={ClipboardCheck} title={activeConfiguration.empty} description="Pilih kategori lain atau buka daftar penugasan lengkap."/>}</div>
            <aside className="card overflow-hidden"><div className="section-heading"><div><h2>Notifikasi Terbaru</h2><p>Pembaruan aktivitas dan jadwal Anda.</p></div><button className="text-button" onClick={() => navigate('notifications')}>Lihat Semua <ChevronRight size={15}/></button></div>{notifications.length ? <div className="divide-y divide-line">{notifications.map(item => <button key={item.id} onClick={() => navigate('notifications')} className={`flex w-full gap-3 p-4 text-left hover:bg-canvas ${item.read_at ? '' : 'notification-unread'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? 'bg-line' : 'bg-brand'}`}/><span><b className="block text-sm">{item.title}</b><span className="mt-1 block text-xs leading-5 text-neutral">{item.message}</span><time className="mt-2 block text-[11px] text-neutral">{dateTimeText(item.created_at)}</time></span></button>)}</div> : <EmptyState icon={Bell} title="Belum ada notifikasi" description="Pembaruan penugasan akan muncul di sini."/>}</aside>
        </section></>;
}

function StaffScheduleTable({ rows, open }) {
    return <div className="mobile-scroll"><table className="data-table w-full min-w-[650px] text-xs"><thead><tr><th>Nama Acara</th><th>Tanggal & Waktu</th><th>Lokasi</th><th>Penugasan</th><th>Status</th></tr></thead><tbody>{rows.map(event => <tr key={event.id} className="cursor-pointer" onClick={() => open(event.id)}><td className="font-semibold">{event.event_name}</td><td>{dateText(event.event_date)}<span className="block text-[11px] text-neutral">{timeText(event.start_time)}–{timeText(event.end_time)}</span></td><td>{event.venue?.name || event.custom_venue || '—'}</td><td>{event.staff?.[0]?.pivot?.responsibility || 'Staf Acara'}</td><td><StatusBadge status={event.status}/></td></tr>)}</tbody></table></div>;
}

function StaffAssignments() {
    const [filter, setFilter] = useState('all'); const [query, setQuery] = useState(''); const [detailId, setDetailId] = useState(null);
    const resource = useResource(`/staff/assignments?per_page=10&filter=${filter}&search=${encodeURIComponent(query)}`, [filter, query]);
    const rows = resource.data?.data || [];
    return <><PageHeader title="Penugasan Saya" subtitle="Lihat dan kelola tanggung jawab acara Anda yang akan datang."/>
        <section className="card overflow-hidden"><ListToolbar><div className="flex flex-wrap gap-2">{['all','upcoming','ongoing','completed'].map(item => <button key={item} onClick={() => setFilter(item)} className={`staff-filter ${filter === item ? 'is-active' : ''}`}>{({ all: 'Semua', upcoming: 'Mendatang', ongoing: 'Sedang Berlangsung', completed: 'Selesai' })[item]}</button>)}</div><SearchField compact className="list-toolbar-secondary" value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter penugasan..."/></ListToolbar>
        {resource.loading ? <TableSkeleton/> : resource.error ? <StaffError compact retry={resource.reload}/> : rows.length ? <div className="mobile-scroll"><table className="data-table w-full min-w-[880px] text-xs"><thead><tr><th>Nama Acara</th><th>Tanggal & Waktu</th><th>Lokasi</th><th>Peran</th><th>Status</th><th className="text-right">Aksi</th></tr></thead><tbody>{rows.map(event => <tr key={event.id}><td><b className="block">{event.event_name}</b><span className="text-[10px] text-neutral">ID: EVT-{String(event.id).padStart(4,'0')}</span></td><td>{dateText(event.event_date)}<span className="block text-[11px] text-neutral">{timeText(event.start_time)}–{timeText(event.end_time)}</span></td><td>{event.venue?.name || event.custom_venue || '—'}</td><td>{event.staff?.[0]?.pivot?.responsibility || 'Staf Acara'}</td><td><StatusBadge status={event.status}/></td><td className="text-right"><button className="btn btn-secondary min-h-8 px-3 py-1 text-xs" onClick={() => setDetailId(event.id)}>Detail <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardCheck} title="Belum ada penugasan" description="Saat ini Anda belum memiliki penugasan acara."/>}
        {resource.data?.total > 0 && <footer className="border-t border-line px-4 py-3 text-xs text-neutral">Menampilkan {resource.data.from}–{resource.data.to} dari {resource.data.total} penugasan</footer>}</section>
        {detailId && <StaffAssignmentDetail id={detailId} close={() => setDetailId(null)}/>}
    </>;
}

function StaffAssignmentDetail({ id, close }) {
    const resource = useResource(`/staff/assignments/${id}`);
    if (resource.loading) return <Modal title="Detail Penugasan" close={close}><PageSkeleton cards={2}/></Modal>;
    if (resource.error) return <Modal title="Detail Penugasan" close={close}><StaffError retry={resource.reload}/></Modal>;
    const event = resource.data;
    return <Modal title={event.event_name} subtitle="Penugasan acara Anda" close={close}><div className="mb-5"><StatusBadge status={event.status}/></div><dl className="grid gap-5 border-y border-line py-5 sm:grid-cols-2"><Info label="Tanggal" value={dateText(event.event_date)}/><Info label="Waktu" value={`${timeText(event.start_time)}–${timeText(event.end_time)}`}/><Info label="Lokasi" value={event.venue?.name || event.custom_venue}/><Info label="Peran" value={event.staff?.[0]?.pivot?.responsibility || 'Staf Acara'}/><Info label="PIC Acara" value={event.creator?.name}/></dl><div className="mt-5"><h3 className="font-semibold">Deskripsi</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral">{event.description || 'Tidak ada deskripsi.'}</p></div></Modal>;
}

function StaffDashboardSkeleton() { return <><PageSkeleton cards={4}/><div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]"><div className="card"><TableSkeleton/></div><ListSkeleton/></div></>; }
function StaffError({ retry, compact }) { return <div className={`flex flex-col items-center justify-center p-8 text-center ${compact ? 'min-h-48' : 'card min-h-64'}`}><X className="text-brand"/><h3 className="mt-4 font-semibold">Penugasan gagal dimuat.</h3><p className="mt-1 text-sm text-neutral">Silakan coba kembali.</p><button className="btn btn-secondary mt-4" onClick={retry}>Coba Lagi</button></div>; }

function EventList({ role, page }) {
    const [query, setQuery] = useState(''); const [status, setStatus] = useState(''); const [formEvent, setFormEvent] = useState(null); const [detailId, setDetailId] = useState(null);
    const endpoint = `/events?per_page=50&search=${encodeURIComponent(query)}&status=${status}`;
    const resource = useResource(endpoint, [query, status]);
    const rows = resource.data?.data || [];
    const filtered = page === 'pending' ? rows.filter(item => item.status === 'PENDING_APPROVAL') : rows;
    const heading = page === 'pending' ? ['Antrean Persetujuan', 'Pengajuan acara yang menunggu tinjauan Anda.'] : page === 'schedule' ? ['Jadwal Saya', 'Acara yang ditugaskan kepada Anda.'] : role === 'ADMIN' ? ['Manajemen Acara', 'Pantau dan kelola seluruh acara perusahaan dan publik.'] : ['Acara Saya', 'Kelola dan pantau pengajuan acara Anda.'];
    if (detailId) return <EventDetail fullPage id={detailId} role={role} close={() => setDetailId(null)} edit={event => { setDetailId(null); setFormEvent(event); }} changed={resource.reload} backLabel={page === 'pending' ? 'Kembali ke Antrean Persetujuan' : 'Kembali ke Daftar Acara'}/>;
    return <><PageHeader title={heading[0]} subtitle={heading[1]} action={role === 'PIC' && <button className="btn btn-primary" onClick={() => setFormEvent({})}><Plus size={17}/>Buat Acara</button>}/>
        <section className="card"><ListToolbar single={page === 'pending'}><SearchField value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari acara…"/>{page !== 'pending' && <select className="field list-toolbar-filter" value={status} onChange={e => setStatus(e.target.value)}><option value="">Semua status</option>{Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</ListToolbar>
        {resource.loading ? <TableSkeleton/> : resource.error ? <ErrorState compact retry={resource.reload}/> : filtered.length ? <EventTable rows={filtered} open={setDetailId}/> : <EmptyState icon={ClipboardCheck} title={page === 'pending' ? 'Tidak ada persetujuan tertunda' : page === 'schedule' ? 'Belum ada acara yang ditugaskan' : 'Belum ada acara'} description={query || status ? 'Tidak ada data yang sesuai dengan pencarian atau filter.' : 'Data acara akan muncul di sini setelah tersedia.'}/>}</section>
        {formEvent !== null && <EventForm event={formEvent} close={() => setFormEvent(null)} done={saved => { setFormEvent(null); resource.reload(); if (saved?.id) setDetailId(saved.id); }}/>} 
    </>;
}

function EventTable({ rows, open }) {
    return <div className="mobile-scroll"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-neutral"><th className="p-4">Acara</th><th className="p-4">Jadwal</th><th className="p-4">Lokasi</th><th className="p-4">PIC</th><th className="p-4">Staf</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{rows.map(event => <tr key={event.id} className="table-row border-b border-line last:border-0"><td className="p-4"><b className="block max-w-64 truncate">{event.event_name || 'Draf tanpa judul'}</b><span className="text-xs text-neutral">{event.custom_event_type || event.event_type || 'Jenis belum dipilih'}</span></td><td className="p-4 whitespace-nowrap"><b>{dateText(event.event_date)}</b><span className="block text-xs text-neutral">{timeText(event.start_time)}–{timeText(event.end_time)}</span></td><td className="p-4">{event.venue?.name || event.custom_venue || '—'}</td><td className="p-4">{event.creator?.name || '—'}</td><td className="p-4"><b>{event.staff?.length || 0}/{event.staff_required || 0}</b><span className="block text-xs text-neutral">{event.staff?.length >= event.staff_required ? 'Terpenuhi' : 'Belum lengkap'}</span></td><td className="p-4"><StatusBadge status={event.status}/></td><td className="p-4 text-right"><button className="btn btn-secondary min-h-0 px-3 py-2 text-xs" onClick={() => open(event.id)}>Lihat detail</button></td></tr>)}</tbody></table></div>;
}

function FullPageDetail({ title, subtitle, close, backLabel = 'Kembali ke daftar acara', children }) {
    return <div className="event-detail-page"><button className="text-button mb-5" onClick={close}><ChevronLeft size={18}/>{backLabel}</button><PageHeader title={title} subtitle={subtitle}/><div className="card p-5 sm:p-7">{children}</div></div>;
}

function EventDetail({ id, role, close, edit, changed, fullPage = false, backLabel }) {
    const resource = useResource(`/events/${id}`); const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const toast = useContext(ToastContext);
    async function decide(decision) {
        if (decision === 'REJECT' && reason.trim().length < 5) return toast('Alasan penolakan minimal 5 karakter.', 'error');
        setBusy(true); try { await api('post', `/events/${id}/decision`, { decision, rejection_reason: reason }); toast(decision === 'APPROVE' ? 'Acara berhasil disetujui.' : 'Acara telah ditolak.'); changed(); close(); } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); }
    }
    const Frame = fullPage ? FullPageDetail : Modal;
    if (resource.loading) return <Frame title="Detail Acara" close={close} backLabel={backLabel}><PageSkeleton cards={2}/></Frame>;
    if (resource.error) return <Frame title="Detail Acara" close={close} backLabel={backLabel}><ErrorState retry={resource.reload}/></Frame>;
    const event = resource.data; const last = event.approvals?.at(-1);
    return <Frame title={event.event_name || 'Acara tanpa judul'} subtitle={`${event.custom_event_type || event.event_type || 'Acara'} · EVT-${String(event.id).padStart(4,'0')}`} close={close} backLabel={backLabel}>
        <div className="mb-5 flex flex-wrap items-center gap-2"><StatusBadge status={event.status}/><span className="text-xs text-neutral">Dibuat {dateTimeText(event.created_at)}</span></div>
        <section className="grid gap-x-8 gap-y-5 border-y border-line py-5 sm:grid-cols-2"><Info label="PIC" value={event.creator?.name}/><Info label="Tanggal reservasi" value={dateText(event.event_date)}/><Info label="Waktu" value={`${timeText(event.start_time)}–${timeText(event.end_time)}`}/><Info label="Lokasi" value={event.venue?.name || event.custom_venue}/><Info label="Jumlah peserta" value={event.participants_count ? `${event.participants_count} orang` : 'Belum diisi'}/><Info label="Kebutuhan staf" value={`${event.staff?.length || 0}/${event.staff_required || 0} staf`}/></section>
        <section className="mt-5"><h3 className="text-sm font-black">Staf yang ditugaskan</h3>{event.staff?.length ? <div className="mt-3 flex flex-wrap gap-2">{event.staff.map(person => <span key={person.id} className="badge badge-neutral">{person.name}</span>)}</div> : <p className="mt-2 text-sm text-neutral">Belum ada staf yang ditugaskan.</p>}</section>
        <section className="mt-5 grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-black">Deskripsi</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral">{event.description || 'Tidak ada deskripsi.'}</p></div><div><h3 className="text-sm font-black">Catatan internal</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral">{event.notes || 'Tidak ada catatan.'}</p></div></section>
        <section className="mt-6"><h3 className="text-sm font-black">Riwayat persetujuan</h3>{event.approvals?.length ? <div className="mt-3 space-y-3">{event.approvals.map(item => <div key={item.id} className="border-l-2 border-brand pl-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{item.status === 'APPROVED' ? 'Disetujui' : item.status === 'RESUBMITTED' ? 'Direvisi & diajukan ulang' : 'Ditolak'} oleh {item.approver?.name}</b><span className="text-xs text-neutral">{dateTimeText(item.created_at)}</span></div>{item.rejection_reason && <p className="mt-1 text-brand-dark">{item.rejection_reason}</p>}</div>)}</div> : <p className="mt-2 text-sm text-neutral">Belum ada keputusan persetujuan.</p>}</section>
        {last?.rejection_reason && event.status === 'REJECTED' && <Alert tone="error"><b>Alasan penolakan:</b> {last.rejection_reason}</Alert>}
        {rejecting && <div className="mt-5 border-t border-line pt-5"><Field label="Alasan penolakan" hint="Jelaskan perubahan yang perlu dilakukan PIC."><textarea autoFocus className="field" rows="3" value={reason} onChange={e => setReason(e.target.value)} /></Field><div className="mt-3 flex justify-end gap-2"><button className="btn btn-secondary" onClick={() => setRejecting(false)}>Batal</button><button className="btn btn-danger" disabled={busy} onClick={() => decide('REJECT')}>Konfirmasi penolakan</button></div></div>}
        {!rejecting && <div className="mt-6 flex flex-wrap justify-end gap-2">{role === 'PIC' && ['DRAFT', 'REJECTED'].includes(event.status) && <button className="btn btn-primary" onClick={() => edit(event)}>Revisi & Ajukan Ulang</button>}{role === 'APPROVER' && event.status === 'PENDING_APPROVAL' && <><button className="btn btn-secondary" onClick={() => setRejecting(true)}>Tolak / Minta Revisi</button><button className="btn btn-primary" disabled={busy} onClick={() => decide('APPROVE')}><Check size={17}/>Setujui Pengajuan</button></>}</div>}
    </Frame>;
}

function EventForm({ event = {}, close, done }) {
    const isRevision = event.status === 'REJECTED';
    const revisionRequest = isRevision ? [...(event.approvals || [])].reverse().find(item => item.status === 'REJECTED') : null;
    const [form, setForm] = useState({ event_name: event.event_name || '', event_type: event.event_type || '', custom_event_type: event.custom_event_type || '', event_date: event.event_date || '', start_time: timeText(event.start_time) === '—' ? '' : timeText(event.start_time), end_time: timeText(event.end_time) === '—' ? '' : timeText(event.end_time), venue_id: event.venue_id || '', custom_venue: event.custom_venue || '', participants_count: event.participants_count || '', staff_required: event.staff_required ?? '', staff_ids: event.staff?.map(person => person.id) || [], description: event.description || '', notes: event.notes || '' });
    const [meta, setMeta] = useState({ venues: [], staff: [], types: [] }); const [loadingMeta, setLoadingMeta] = useState(true); const [errors, setErrors] = useState({}); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const toast = useContext(ToastContext);
    const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
    async function loadMeta() { setLoadingMeta(true); try { const params = form.event_date && form.start_time && form.end_time ? `?event_date=${form.event_date}&start_time=${form.start_time}&end_time=${form.end_time}${event.id ? `&event_id=${event.id}` : ''}` : ''; setMeta(await api('get', `/bootstrap${params}`)); } catch (error) { setMessage(error.message); } finally { setLoadingMeta(false); } }
    useEffect(() => { loadMeta(); }, [form.event_date, form.start_time, form.end_time]);
    async function save(submit) { setBusy(true); setErrors({}); setMessage(''); try { const saved = await api(event.id ? 'put' : 'post', event.id ? `/events/${event.id}` : '/events', { ...form, submit }); toast(isRevision ? 'Revisi berhasil diajukan ulang.' : submit ? 'Acara berhasil diajukan untuk persetujuan.' : 'Draf berhasil disimpan.'); done(saved); } catch (error) { setErrors(error.errors || {}); setMessage(error.message); } finally { setBusy(false); } }
    const selectedVenue = meta.venues.find(venue => String(venue.id) === String(form.venue_id));
    return <Modal title={isRevision ? 'Revisi Acara' : event.id ? 'Edit Acara' : 'Buat Acara'} subtitle={isRevision ? `EVT-${String(event.id).padStart(4, '0')} · ${event.event_name}` : 'Lengkapi informasi reservasi dan kebutuhan operasional.'} close={close}>
        {isRevision && <Alert tone="error"><b className="block">Revisi Diminta</b><span className="mt-1 block text-sm">Penyetuju: {revisionRequest?.approver?.name || '—'}</span><span className="mt-1 block text-sm">Catatan revisi: {revisionRequest?.rejection_reason || 'Tidak ada catatan revisi.'}</span></Alert>}
        {message && <Alert tone="error">{message}</Alert>}
        <FormSection title="Informasi acara" description="Judul, jenis, dan kebutuhan peserta."><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama acara" error={errors.event_name}><input className="field" value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="Nama kegiatan" /></Field><Field label="Jenis acara" error={errors.event_type}><select className="field" value={form.event_type} onChange={e => set('event_type', e.target.value)}><option value="">Pilih jenis acara</option>{meta.types.map(type => <option key={type}>{type}</option>)}</select></Field>{form.event_type === 'Other' && <Field label="Jenis acara lainnya" error={errors.custom_event_type}><input className="field" value={form.custom_event_type} onChange={e => set('custom_event_type', e.target.value)} /></Field>}<Field label="Jumlah peserta" error={errors.participants_count}><input type="number" min="1" className="field" value={form.participants_count} onChange={e => set('participants_count', e.target.value)} placeholder="Contoh: 50" /></Field></div></FormSection>
        <FormSection title="Jadwal & Lokasi" description="Jadwal digunakan untuk memeriksa konflik lokasi dan staf."><div className="grid gap-4 sm:grid-cols-3"><Field label="Tanggal reservasi" error={errors.event_date}><input type="date" min={new Date().toISOString().slice(0, 10)} className="field" value={form.event_date} onChange={e => set('event_date', e.target.value)} /></Field><Field label="Waktu mulai" error={errors.start_time}><input type="time" className="field" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></Field><Field label="Waktu selesai" error={errors.end_time}><input type="time" className="field" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Lokasi" error={errors.venue_id || errors.custom_venue}><select className="field" value={form.venue_id} onChange={e => set('venue_id', e.target.value)}><option value="">Lokasi lainnya</option>{meta.venues.map(venue => <option disabled={!venue.available && String(venue.id) !== String(form.venue_id)} key={venue.id} value={venue.id}>{venue.name} · Kapasitas {venue.capacity || '—'} · {venue.available || String(venue.id) === String(form.venue_id) ? 'Tersedia' : 'Tidak tersedia'}</option>)}</select>{selectedVenue && <p className="mt-2 text-xs text-neutral">{selectedVenue.type || 'Lokasi'} · {selectedVenue.location || 'Lokasi belum diisi'} · Kapasitas {selectedVenue.capacity || '—'} orang · {selectedVenue.available ? 'Tersedia pada jadwal ini' : 'Tidak tersedia pada jadwal ini'}</p>}</Field>{!form.venue_id && <Field label="Nama lokasi lainnya" error={errors.custom_venue}><input className="field" value={form.custom_venue} onChange={e => set('custom_venue', e.target.value)} /></Field>}</div></FormSection>
        <FormSection title="Kebutuhan operasional" description="Staf yang bentrok dengan jadwal tidak dapat dipilih."><div className="grid gap-4 sm:grid-cols-2"><Field label="Jumlah staf dibutuhkan" error={errors.staff_required}><input type="number" min="0" max="100" className="field" value={form.staff_required} onChange={e => set('staff_required', e.target.value)} /></Field><Field label="Staf yang ditugaskan" error={errors.staff_ids} hint={`${form.staff_ids.length}/${form.staff_required || 0} staf dipilih`}><div className="max-h-44 overflow-auto rounded-md border border-line p-2">{loadingMeta ? <div className="p-3 text-sm text-neutral">Memeriksa ketersediaan…</div> : meta.staff.length ? meta.staff.map(person => { const checked = form.staff_ids.includes(person.id); return <label key={person.id} className={`flex items-center gap-3 rounded px-2 py-2 text-sm ${person.available ? 'hover:bg-canvas' : 'cursor-not-allowed opacity-50'}`}><input type="checkbox" disabled={!person.available && !checked} checked={checked} onChange={e => set('staff_ids', e.target.checked ? [...form.staff_ids, person.id] : form.staff_ids.filter(id => id !== person.id))}/><span className="flex-1"><b>{person.name}</b><span className="block text-xs text-neutral">Staf · {person.available || checked ? 'Tersedia' : 'Tidak tersedia pada jadwal ini'}</span></span></label>; }) : <p className="p-3 text-sm text-neutral">Tidak ada staf aktif.</p>}</div></Field></div></FormSection>
        <FormSection title="Detail tambahan"><div className="grid gap-4 sm:grid-cols-2"><Field label="Deskripsi event" error={errors.description}><textarea className="field" rows="4" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tujuan dan rangkaian kegiatan" /></Field><Field label="Catatan internal" error={errors.notes}><textarea className="field" rows="4" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Informasi khusus untuk tim internal" /></Field></div></FormSection>
        <div className="sticky -bottom-6 -mx-6 mt-6 flex flex-col-reverse gap-2 border-t border-line bg-white px-6 py-4 sm:flex-row sm:justify-end"><button disabled={busy} className="btn btn-secondary" onClick={close}>Batal</button>{!isRevision && <button disabled={busy} className="btn btn-secondary" onClick={() => save(false)}>Simpan Draf</button>}<button disabled={busy} className="btn btn-primary" onClick={() => save(true)}>{busy ? <><Spinner/>Menyimpan…</> : isRevision ? 'Simpan & Ajukan Ulang' : 'Ajukan untuk Persetujuan'}</button></div>
    </Modal>;
}

function CalendarPage() {
    const { user } = useContext(SessionContext); const resource = useResource(user.role === 'STAFF' ? '/staff/calendar' : '/events?calendar=1&per_page=50'); const [month, setMonth] = useState(new Date()); const [selected, setSelected] = useState(null);
    const first = new Date(month.getFullYear(), month.getMonth(), 1), days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
    if (resource.loading) return <PageSkeleton cards={1}/>; if (resource.error) return <ErrorState retry={resource.reload}/>;
    const events = (user.role === 'STAFF' ? resource.data : resource.data.data) || [];
    const today = new Date();
    return <><PageHeader title="Kalender Acara" subtitle="Jadwal acara yang telah disetujui dan terkonfirmasi."/><section className="card overflow-hidden"><div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><button aria-label="Bulan sebelumnya" className="btn btn-secondary px-2.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18}/></button><button aria-label="Bulan berikutnya" className="btn btn-secondary px-2.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18}/></button><button className="btn btn-secondary" onClick={() => setMonth(new Date())}>Hari ini</button></div><h2 className="text-base font-bold capitalize sm:text-lg">{month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2><div className="calendar-legend text-xs text-neutral"><span><i className="calendar-legend-dot calendar-event--scheduled"/>Merah — Terjadwal</span><span><i className="calendar-legend-dot calendar-event--ongoing"/>Aktif — Sedang berlangsung</span><span><i className="calendar-legend-dot calendar-event--completed"/>Hijau — Selesai</span><span><i className="calendar-legend-dot calendar-event--cancelled"/>Abu-abu — Dibatalkan</span></div></div><div className="p-3 sm:p-5"><div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wide text-neutral sm:text-xs">{'Min Sen Sel Rab Kam Jum Sab'.split(' ').map(day => <div className="py-2" key={day}>{day}</div>)}</div><div className="grid grid-cols-7 border-l border-t border-line">{cells.map((day, index) => { const daily = day ? events.filter(item => { const [year, monthNumber, date] = item.event_date.split('-').map(Number); return year === month.getFullYear() && monthNumber - 1 === month.getMonth() && date === day; }) : []; const isToday = day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear(); return <div key={index} className={`calendar-cell min-h-20 border-b border-r border-line p-1.5 sm:min-h-32 sm:p-2 ${isToday ? 'is-today' : ''}`}><span className="calendar-day text-xs font-semibold">{day}</span>{daily.map(event => <button aria-label={`${event.event_name}, ${timeText(event.start_time)}, ${STATUS[event.status] || event.status}`} title={`${event.event_name} · ${timeText(event.start_time)}–${timeText(event.end_time)}`} onClick={() => setSelected(event.id)} key={event.id} className={`calendar-event mt-1 block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-bold sm:text-xs ${getEventStatusClass(event.status)}`}><span className="hidden sm:inline">{timeText(event.start_time)} · </span>{event.event_name}</button>)}</div>; })}</div></div></section>{!events.length && <EmptyState icon={CalendarDays} title="Belum ada acara terjadwal" description="Acara akan muncul setelah disetujui."/>}{selected && <EventDetail id={selected} role={user.role} close={() => setSelected(null)} changed={resource.reload}/>}</>;
}

function AvailabilityPage({ mode }) {
    const today = new Date().toISOString().slice(0, 10);
    const [filters, setFilters] = useState({ event_date: today, start_time: '08:00', end_time: '17:00' });
    const query = new URLSearchParams(filters).toString();
    const resource = useResource(`/bootstrap?${query}`, [filters.event_date, filters.start_time, filters.end_time]);
    const eventResource = useResource('/events?per_page=50');
    const isVenue = mode === 'venue';
    const rows = resource.data?.[isVenue ? 'venues' : 'staff'] || [];
    const available = rows.filter(item => item.available).length;
    const events = (eventResource.data?.data || []).filter(event => event.event_date === filters.event_date && event.start_time && event.end_time);
    return <>
        <PageHeader title={isVenue ? 'Ketersediaan Lokasi' : 'Ketersediaan Staf'} subtitle={isVenue ? 'Periksa penggunaan fasilitas dan potensi konflik pada jadwal nyata.' : 'Periksa kesiapan personel dan konflik penugasan pada jadwal nyata.'}/>
        <section className="card mb-6 p-4 sm:p-5"><div className="grid gap-4 sm:grid-cols-3"><Field label="Tanggal"><input className="field" type="date" value={filters.event_date} onChange={e => setFilters({ ...filters, event_date: e.target.value })}/></Field><Field label="Waktu mulai"><input className="field" type="time" value={filters.start_time} onChange={e => setFilters({ ...filters, start_time: e.target.value })}/></Field><Field label="Waktu selesai"><input className="field" type="time" value={filters.end_time} onChange={e => setFilters({ ...filters, end_time: e.target.value })}/></Field></div></section>
        {resource.loading || eventResource.loading ? <TableSkeleton/> : resource.error || eventResource.error ? <ErrorState retry={() => { resource.reload(); eventResource.reload(); }}/> : <><div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="availability-key available">{available} tersedia</span><span className="availability-key conflict">{rows.length - available} terpakai pada rentang terpilih</span><span className="availability-key">{events.length} pemesanan pada tanggal ini</span></div><div className="mobile-scroll"><AvailabilityGrid rows={rows} events={events} mode={mode}/></div></>}
    </>;
}

function Notifications({ notificationsChanged }) {
    const { user } = useContext(SessionContext); const resource = useResource(user.role === 'STAFF' ? '/staff/notifications' : '/notifications'); const toast = useContext(ToastContext); const [deletingAll, setDeletingAll] = useState(false); const [busy, setBusy] = useState(false);
    useEffect(() => { const timer = window.setInterval(resource.reload, 45000); return () => window.clearInterval(timer); }, []);
    const refresh = () => { resource.reload(); notificationsChanged?.(); };
    async function mark(item) { if (item.read_at) return; try { await api('post', `/notifications/${item.id}/read`); refresh(); } catch (error) { toast(error.message, 'error'); } }
    async function markAll() { setBusy(true); try { const result = await api('patch', '/notifications/read-all'); toast(result.message); refresh(); } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); } }
    async function removeAll() { setBusy(true); try { const result = await api('delete', '/notifications'); setDeletingAll(false); toast(result.message); refresh(); } catch (error) { toast(error.message, 'error'); } finally { setBusy(false); } }
    const notifications = resource.data?.data || []; const unread = resource.data?.unread_count || 0;
    return <><PageHeader title="Notifikasi" subtitle="Pembaruan persetujuan, penugasan, dan pengingat jadwal."/>{resource.loading ? <ListSkeleton/> : resource.error ? <ErrorState retry={resource.reload}/> : notifications.length ? <section className="card overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4"><div><h2 className="text-base font-bold">Aktivitas terbaru</h2><p className="mt-1 text-xs text-neutral">Notifikasi yang belum dibaca ditandai warna crimson.</p><span className="badge mt-3">{unread} belum dibaca</span></div><div className="flex flex-wrap gap-2"><button className="btn btn-secondary min-h-9 px-3 py-2 text-xs" disabled={busy || unread === 0} onClick={markAll}><Check size={15}/>Tandai semua telah dibaca</button><button className="btn btn-danger min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => setDeletingAll(true)}>Hapus semua notifikasi</button></div></header><div className="divide-y divide-line">{notifications.map(item => <button onClick={() => mark(item)} key={item.id} className={`flex w-full gap-4 p-4 text-left transition-colors hover:bg-canvas sm:p-5 ${item.read_at ? '' : 'notification-unread'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read_at ? 'bg-surface-container-low text-neutral' : 'bg-brand text-white'}`}><Bell size={16}/></span><span className="flex-1"><span className="flex flex-wrap items-start justify-between gap-2"><b className="text-sm">{item.title}</b><time className="text-xs text-neutral">{dateTimeText(item.created_at)}</time></span><span className="mt-1 block text-sm leading-6 text-neutral">{item.message}</span>{!item.read_at && <span className="mt-2 block text-[11px] font-bold text-brand">Belum dibaca</span>}</span></button>)}</div></section> : <EmptyState icon={Bell} title="Belum ada notifikasi" description="Tidak ada notifikasi untuk ditampilkan."/>}{deletingAll && <Modal title="Hapus semua notifikasi?" close={() => !busy && setDeletingAll(false)} size="sm"><p className="text-sm leading-6 text-neutral">Semua notifikasi pada akun Anda akan dihapus dan tindakan ini tidak dapat dibatalkan.</p><div className="mt-6 flex flex-wrap justify-end gap-2"><button className="btn btn-secondary" disabled={busy} onClick={() => setDeletingAll(false)}>Batal</button><button className="btn btn-danger" disabled={busy} onClick={removeAll}>{busy ? 'Menghapusâ€¦' : 'Hapus semua'}</button></div></Modal>}</>;
}

function UserManagement({ staffOnly }) {
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
    const anchor = new Date(); anchor.setDate(1); const series = Array.from({length: 7}, (_, index) => { const date = new Date(anchor.getFullYear(), anchor.getMonth() - 6 + index, 1); const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; return { key, label: date.toLocaleDateString('id-ID',{month:'short'}), value: events.filter(event => event.event_date?.startsWith(key)).length }; });
    const usage = Object.values(events.reduce((result,event) => { const name=event.venue?.name || event.custom_venue || 'Belum ditentukan'; result[name] ||= {name,value:0}; result[name].value++; return result; },{})).sort((a,b)=>b.value-a.value).slice(0,4); const usageMax=Math.max(1,...usage.map(item=>item.value));
    return <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]"><div className="card p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="section-title">Volume Acara</h2><p className="mt-1 text-sm text-neutral">Jumlah acara per bulan dari data yang dimuat</p></div><span className="badge badge-neutral">Bulanan</span></div><OperationalChart series={series}/></div><aside className="card p-6"><h2 className="section-title">Penggunaan Lokasi</h2><p className="mt-1 text-sm text-neutral">Pemesanan berdasarkan lokasi</p><div className="report-bars mt-7">{usage.map(item=><div key={item.name}><div className="mb-2 flex justify-between gap-3 text-sm"><b className="truncate">{item.name}</b><span>{item.value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-brand-soft"><span className="block h-full rounded-full bg-brand" style={{width:`${(item.value/usageMax)*100}%`}}/></div></div>)}{!usage.length && <p className="text-sm text-neutral">Data penggunaan lokasi belum tersedia.</p>}</div></aside></section>;
}

function ProfilePage() {
    const { user } = useContext(SessionContext);
    return <><PageHeader title={user.role === 'STAFF' ? 'Pengaturan Akun' : 'Pengaturan Profil'} subtitle={user.role === 'STAFF' ? 'Kelola informasi akun dan akses Technolife Anda.' : 'Informasi akun dan akses Technolife Anda.'}/><section className="profile-grid"><aside className="card flex flex-col items-center p-6 text-center"><Avatar name={user.name} large/><h2 className="mt-5 text-xl font-semibold">{user.name}</h2><p className="mt-1 text-sm text-brand">{ROLE[user.role]}</p><span className="badge badge-approved mt-4">{user.is_active ? 'Akun Aktif' : 'Akun Nonaktif'}</span></aside><div className="card p-6"><div className="border-b border-line pb-4"><h2 className="section-title">Informasi Akun</h2><p className="mt-1 text-sm text-neutral">Data ini berasal dari akun terautentikasi Anda.</p></div><dl className="mt-6 grid gap-6 sm:grid-cols-2"><Info label="Nama lengkap" value={user.name}/><Info label="Peran" value={ROLE[user.role]}/><div className="sm:col-span-2"><Info label="Alamat email" value={user.email}/></div><Info label="Nomor telepon" value={user.phone || 'Belum diatur'}/><Info label="Status akun" value={user.is_active ? 'Aktif' : 'Nonaktif'}/></dl></div></section></>;
}

function useResource(url, dependencies = []) {
    const [state, setState] = useState({ loading: true, data: null, error: null }); const [version, setVersion] = useState(0);
    useEffect(() => { let active = true; setState(current => ({ ...current, loading: true, error: null })); api('get', url).then(data => active && setState({ loading: false, data, error: null })).catch(error => active && setState({ loading: false, data: null, error })); return () => { active = false; }; }, [url, version, ...dependencies]);
    return { ...state, reload: () => setVersion(value => value + 1) };
}

function DashboardHero({ eyebrow, description, actionLabel, onAction, date }) { return <section className="dashboard-hero"><div className="self-center"><p className="hero-eyebrow">{eyebrow}</p><h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">Selamat datang kembali</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{description}</p><button className="btn btn-primary mt-6" onClick={onAction}>{actionLabel}<ChevronRight size={17}/></button></div><div className="hero-date"><CalendarDays className="text-brand" size={23}/><p className="mt-4 text-xs uppercase tracking-wider text-white/45">Hari ini</p><p className="mt-1 font-semibold capitalize">{date}</p></div></section>; }
function ListToolbar({ children, single = false }) { return <div className={`list-toolbar ${single ? 'is-single' : ''}`}>{children}</div>; }
function SearchField({ className = '', compact = false, ...props }) { return <div className={`search-field ${className}`}><Search className="search-field-icon" size={compact ? 15 : 17}/><input className={`field search-field-input ${compact ? 'is-compact' : ''}`} type="search" {...props}/></div>; }
function PageHeader({ title, subtitle, action }) { return <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-[-.02em] sm:text-[32px] sm:leading-10">{uiText(title)}</h1><p className="mt-1 text-base leading-6 text-neutral">{uiText(subtitle)}</p></div>{action}</header>; }
function StatCard({ label, count, accent, active = false, onClick }) { const content = <div className="flex h-full items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.06em] text-neutral">{label}</p><p className="mt-3 text-[32px] font-bold leading-10 tracking-tight">{count ?? 0}</p><p className="mt-2 text-xs text-neutral">Berdasarkan data terkini</p></div><span className={`stat-card-icon flex h-11 w-11 items-center justify-center rounded-xl ${accent || active ? 'bg-brand text-white' : 'bg-surface-container-low text-neutral'}`}><CalendarCheck size={20}/></span></div>; return onClick ? <button type="button" aria-pressed={active} onClick={onClick} className={`stat-card card is-interactive min-h-36 w-full p-6 text-left ${active ? 'is-active' : ''}`}>{content}</button> : <article className={`stat-card card min-h-36 p-6 ${accent ? 'is-accent' : ''}`}>{content}</article>; }

function dashboardMetricConfigurations(role, data) {
    const configurations = {
        PIC: [
            ['draft', 'Draf', data.draft, 'Acara Draf', 'Draf acara yang belum diajukan.', 'Tidak ada acara draf.'],
            ['pending', 'Menunggu Persetujuan', data.pending, 'Menunggu Persetujuan', 'Pengajuan yang sedang menunggu keputusan.', 'Tidak ada acara yang menunggu persetujuan.'],
            ['upcoming', 'Acara Mendatang', data.upcoming, 'Acara Mendatang', 'Acara terjadwal berikutnya berdasarkan waktu pelaksanaan.', 'Belum ada acara mendatang yang terjadwal.'],
            ['completed', 'Acara Selesai', data.completed, 'Acara Selesai', 'Riwayat acara yang telah selesai.', 'Belum ada acara selesai.'],
            ['revision', 'Perlu Revisi', data.rejected, 'Acara Perlu Revisi', 'Pengajuan yang perlu diperbaiki dan diajukan ulang.', 'Tidak ada acara yang perlu direvisi.'],
        ],
        APPROVER: [
            ['pending', 'Menunggu Persetujuan', data.pending, 'Menunggu Persetujuan', 'Pengajuan yang membutuhkan keputusan Anda.', 'Tidak ada persetujuan tertunda.'],
            ['upcoming', 'Acara Mendatang', data.upcoming, 'Acara Mendatang', 'Acara terjadwal yang akan datang.', 'Belum ada acara mendatang.'],
            ['completed', 'Acara Selesai', data.completed, 'Acara Selesai', 'Riwayat acara yang telah selesai.', 'Belum ada acara selesai.'],
            ['rejected', 'Ditolak', data.rejected, 'Pengajuan Ditolak', 'Riwayat pengajuan yang ditolak.', 'Tidak ada pengajuan ditolak.'],
        ],
        ADMIN: [
            ['all', 'Total Acara', data.total, 'Semua Acara', 'Aktivitas acara terbaru di seluruh sistem.', 'Belum ada acara.'],
            ['pending', 'Menunggu Persetujuan', data.pending, 'Menunggu Persetujuan', 'Pengajuan yang masih menunggu keputusan.', 'Tidak ada persetujuan tertunda.'],
            ['upcoming', 'Acara Mendatang', data.upcoming, 'Acara Mendatang', 'Acara terjadwal yang akan datang.', 'Belum ada acara mendatang.'],
            ['completed', 'Acara Selesai', data.completed, 'Acara Selesai', 'Riwayat acara yang telah selesai.', 'Belum ada acara selesai.'],
        ],
    };
    return configurations[role].map(([key, label, count, title, description, empty]) => ({ key, label, count, title, description, empty }));
}

function staffMetricConfigurations(data) { return [
    { key: 'all', label: 'Acara yang Ditugaskan', count: data.assigned, title: 'Semua Penugasan', empty: 'Saat ini Anda belum memiliki penugasan acara.' },
    { key: 'today', label: 'Penugasan Hari Ini', count: data.today, title: 'Penugasan Hari Ini', empty: 'Tidak ada penugasan hari ini.' },
    { key: 'upcoming', label: 'Penugasan Mendatang', count: data.upcoming, title: 'Penugasan Mendatang', empty: 'Belum ada penugasan mendatang.' },
    { key: 'completed', label: 'Penugasan Selesai', count: data.completed, title: 'Penugasan Selesai', empty: 'Belum ada penugasan selesai.' },
]; }

function filterDashboardEvents(events, filter) { const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; return events.filter(event => ({ all: true, draft: event.status === 'DRAFT', pending: event.status === 'PENDING_APPROVAL', upcoming: event.status === 'SCHEDULED' && new Date(`${event.event_date}T${event.start_time}`) > now, completed: event.status === 'COMPLETED', revision: event.status === 'REJECTED', rejected: event.status === 'REJECTED', today: event.event_date === today })[filter] ?? true); }
function sortDashboardEvents(events, filter) { const timestamp = event => new Date(`${event.event_date}T${event.start_time || '00:00:00'}`).getTime(); return [...events].sort((left, right) => filter === 'upcoming' ? timestamp(left) - timestamp(right) : filter === 'completed' ? timestamp(right) - timestamp(left) : new Date(right.updated_at || right.created_at) - new Date(left.updated_at || left.created_at)); }
function StatusBadge({ status }) { const labels = { AVAILABLE: 'Tersedia', CONFLICT: 'Konflik', RESUBMITTED: 'Diajukan Ulang' }; return <span className={`badge badge-${String(status).toLowerCase()} ${status === 'DRAFT' ? 'badge-neutral' : ''}`}>{STATUS[status] || labels[status] || status}</span>; }
function getEventStatusClass(status) { return `calendar-event--${String(status || 'SCHEDULED').toLowerCase().replace('_', '-')}`; }
function Avatar({ name = '', large }) { return <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-black text-brand ${large ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-sm'}`}>{name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span>; }
function Info({ label, value }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-neutral">{label}</dt><dd className="mt-1 text-sm font-semibold">{value || '—'}</dd></div>; }
function Field({ label, error, hint, children }) { const message = Array.isArray(error) ? error[0] : error; return <label className="block text-sm font-bold">{uiText(label)}{hint && <span className="float-right text-xs font-normal text-neutral">{hint}</span>}<div className="mt-2">{children}</div>{message && <span className="mt-1.5 block text-xs font-semibold text-brand-dark">{message}</span>}</label>; }
function FormSection({ title, description, children }) { return <section className="border-b border-line py-5 first:pt-0 last:border-0"><div className="mb-4"><h3 className="font-black">{title}</h3>{description && <p className="mt-1 text-xs leading-5 text-neutral">{description}</p>}</div>{children}</section>; }
function Alert({ children, tone = 'info' }) { return <div className={`mb-5 border-l-4 p-3 text-sm ${tone === 'error' ? 'border-brand bg-brand-soft text-brand-dark' : 'border-neutral bg-canvas text-neutral'}`}>{children}</div>; }
function Spinner() { return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"/>; }
function Modal({ title, subtitle, close, children, size = 'lg' }) { return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3" role="dialog" aria-modal="true" onMouseDown={close}><section className={`card max-h-[94vh] w-full overflow-auto shadow-2xl ${size === 'sm' ? 'max-w-lg' : 'max-w-5xl'}`} onMouseDown={e => e.stopPropagation()}><header className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-white px-5 py-4 sm:px-6"><div><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-neutral">{subtitle}</p>}</div><button aria-label="Tutup dialog" className="icon-button" onClick={close}><X size={21}/></button></header><div className="p-5 sm:p-6">{children}</div></section></div>; }
function EmptyState({ icon: Icon, title, description }) { return <div className="col-span-full flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon size={22}/></div><h3 className="mt-4 font-black">{uiText(title)}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-neutral">{uiText(description)}</p></div>; }
function ErrorState({ retry, compact }) { return <div className={`flex flex-col items-center justify-center p-8 text-center ${compact ? 'min-h-48' : 'card min-h-64'}`}><div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><X/></div><h3 className="mt-4 font-black">Data gagal dimuat</h3><p className="mt-1 text-sm text-neutral">Periksa koneksi Anda lalu coba kembali.</p><button className="btn btn-secondary mt-4" onClick={retry}>Coba lagi</button></div>; }
function PageSkeleton({ cards = 4 }) { return <div><div className="skeleton mb-2 h-8 w-52"/><div className="skeleton mb-6 h-4 w-80 max-w-full"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(cards)].map((_, index) => <div className="card p-5" key={index}><div className="skeleton h-4 w-2/3"/><div className="skeleton mt-4 h-9 w-16"/></div>)}</div></div>; }
function TableSkeleton() { return <div className="space-y-1 p-4">{[...Array(6)].map((_, index) => <div className="flex gap-5 py-3" key={index}><div className="skeleton h-4 flex-[2]"/><div className="skeleton h-4 flex-1"/><div className="skeleton h-4 flex-1"/><div className="skeleton h-4 w-20"/></div>)}</div>; }
function ListSkeleton() { return <div className="card divide-y divide-line">{[...Array(5)].map((_, index) => <div className="p-5" key={index}><div className="skeleton h-4 w-1/3"/><div className="skeleton mt-3 h-4 w-2/3"/></div>)}</div>; }

function App() {
    const [user, setUser] = useState(window.__AUTH_USER__ !== undefined ? window.__AUTH_USER__ : undefined);
    useEffect(() => {
        if (window.__AUTH_USER__ === undefined) {
            api('get', '/me').then(setUser).catch(() => setUser(null));
        }
    }, []);
    if (user === undefined) return <div className="flex min-h-screen items-center justify-center"><Spinner/><span className="ml-3 text-sm font-semibold text-neutral">Memuat aplikasi…</span></div>;
    return <SessionContext.Provider value={{ user, setUser }}>{user ? <Shell user={user} setUser={setUser}/> : <Login onLogin={setUser}/>}</SessionContext.Provider>;
}

try {
    const root = document.getElementById('app');
    if (!root) throw new Error('Elemen root aplikasi tidak ditemukan.');
    createRoot(root).render(<AppErrorBoundary><ToastProvider><App/></ToastProvider></AppErrorBoundary>);
} catch (error) {
    window.__showStartupError?.(error);
}
