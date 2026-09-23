import createStaffError from './pages/staff/StaffError';
import createStaffDashboardSkeleton from './pages/staff/StaffDashboardSkeleton';
import createStaffScheduleTable from './pages/staff/StaffScheduleTable';
import createStaffAssignmentDetail from './pages/staff/StaffAssignmentDetail';
import createStaffAssignments from './pages/staff/StaffAssignments';
import createStaffDashboard from './pages/staff/StaffDashboard';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import {
    Bell, CalendarDays, Check, ChevronRight, ClipboardCheck,
    LayoutDashboard, LogOut, MapPin, Menu, Search, ShieldCheck,
    UserCircle, Users, X, Building2, CalendarCheck, Settings,
} from 'lucide-react';
import '../css/app.css';
import LoginPage from './pages/auth/LoginPage';
import createAdminPages from './pages/admin/AdminPages';
import PicDashboard from './pages/pic/PicDashboard';
import ApproverDashboard from './pages/approver/ApproverDashboard';
import ApproverQueue from './pages/approver/ApproverQueue';
import createSharedPages from './pages/shared/SharedPages';
import createEventFeatures from './features/events/EventFeatures';
import AppErrorBoundary from './app/AppErrorBoundary';
import AvailabilityGrid from './components/AvailabilityGrid';
import OperationalChart from './components/OperationalChart';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name=csrf-token]')?.content;

const SessionContext = createContext(null);
const ToastContext = createContext(() => {});
const STATUS = {
    DRAFT: 'Draf', PENDING_APPROVAL: 'Menunggu Persetujuan', APPROVED: 'Disetujui',
    REJECTED: 'Perlu Revisi', SCHEDULED: 'Terjadwal', ONGOING: 'Sedang Berlangsung',
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
    useEffect(() => { const closeOnEscape = event => event.key === 'Escape' && setDrawer(false); window.addEventListener('keydown', closeOnEscape); document.body.style.overflow = drawer ? 'hidden' : ''; return () => { window.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; }; }, [drawer]);
    async function logout() {
        try {
            const res = await api('post', '/logout');
            if (res?.keycloak_logout_url) {
                window.location.href = res.keycloak_logout_url;
                return;
            }
        } catch (e) {
            // ignore network error on logout
        } finally {
            setUser(null);
            history.replaceState(null, '', '/');
        }
    }
    const current = ['profile', 'settings'].includes(page) ? 'Pengaturan' : navigation[roleKey]?.find(item => item[0] === page)?.[1] || 'Dasbor';
    const branding = brandingFor(roleKey);

    return <div className="min-h-screen lg:flex">
        <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col px-4 py-8 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex min-h-14 items-center justify-between"><div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><CalendarDays size={21}/></span><div><b className="block font-bold text-ink">Technolife</b><span className="text-[11px] font-semibold uppercase tracking-wide text-neutral">{branding.subtitle}</span></div></div><button aria-label="Tutup menu" className="text-neutral lg:hidden" onClick={() => setDrawer(false)}><X/></button></div>
            <nav className="mt-8 flex-1 space-y-1 overflow-y-auto" aria-label="Navigasi utama">{(navigation[roleKey] || []).map(([id, label, Icon]) => <button key={id} onClick={() => { setPage(id); setDrawer(false); }} className={`nav-item ${page === id ? 'is-active' : ''}`}><Icon size={19}/><span>{label}</span></button>)}</nav>
            <div className="border-t border-line pt-4"><button onClick={() => { setPage(roleKey === 'STAFF' ? 'settings' : 'profile'); setDrawer(false); }} className={`nav-item ${page === (roleKey === 'STAFF' ? 'settings' : 'profile') ? 'is-active' : ''}`}><Settings size={18}/>Pengaturan</button><button onClick={logout} className="nav-item"><LogOut size={18}/>Keluar</button></div>
        </aside>
        {drawer && <button aria-label="Tutup menu" className="fixed inset-0 z-30 bg-black/55 lg:hidden" onClick={() => setDrawer(false)}/>} 
        <section className="min-w-0 flex-1"><header className="app-header sticky top-0 z-20 flex h-16 items-center justify-between px-4 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button aria-label="Buka menu" className="mobile-menu-toggle icon-button" onClick={() => setDrawer(true)}><Menu/></button><div className="min-w-0"><p className="truncate text-[11px] font-bold uppercase tracking-[.12em] text-brand">{branding.subtitle}</p><h2 className="truncate text-sm font-bold text-ink sm:text-base">{current}</h2></div></div><div className="flex items-center gap-2 sm:gap-3"><button aria-label="Notifikasi" className="icon-button relative" onClick={() => setPage('notifications')}><Bell size={20}/>{notificationResource.data?.unread_count > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{notificationResource.data.unread_count}</span>}</button><span className="mx-1 hidden h-7 w-px bg-line sm:block"/><button onClick={() => roleKey === 'STAFF' ? setPage('settings') : setProfile(true)} className="flex items-center gap-3 text-left"><span className="hidden sm:block"><b className="block text-right text-sm text-ink">{user.name}</b><span className="block text-right text-xs text-neutral">{ROLE[roleKey] || 'Pengguna'}</span></span><Avatar name={user.name}/></button></div></header>
            <main className="mx-auto max-w-[1440px] p-4 sm:p-6 md:p-8"><Page page={page} role={roleKey} navigate={setPage} notificationsChanged={notificationResource.reload}/></main>
        </section>
        {profile && <Modal title="Profil pengguna" close={() => setProfile(false)} size="sm"><div className="flex items-center gap-4 border-b border-line pb-5"><Avatar name={user.name} large/><div><h3 className="text-lg font-bold text-ink">{user.name}</h3><span className="badge">{ROLE[roleKey] || 'Pengguna'}</span></div></div><dl className="mt-5 space-y-4 text-sm"><Info label="Email" value={user.email}/><Info label="Nomor telepon" value={user.phone || 'Belum diatur'}/><Info label="Status akun" value={user.is_active ? 'Aktif' : 'Nonaktif'}/></dl><div className="mt-6 flex justify-end"><button className="btn btn-danger" onClick={logout}><LogOut size={17}/>Keluar dari sistem</button></div></Modal>}
    </div>;
}

function Page(props) {
    if (props.page === 'dashboard') return props.role === 'STAFF' ? <StaffDashboard {...props}/> : props.role === 'PIC' ? <PicDashboard {...props} Dashboard={Dashboard}/> : props.role === 'APPROVER' ? <ApproverDashboard {...props} Dashboard={Dashboard}/> : <Dashboard {...props}/>;
    if (props.page === 'assignments') return <StaffAssignments {...props}/>;
    if (props.page === 'pending' && props.role === 'APPROVER') return <ApproverQueue {...props} EventList={EventList}/>;
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

    const roleHero = {
        ADMIN: {
            eyebrow: 'Ruang Kerja Admin',
            titlePrefix: 'Selamat Datang di Konsol Admin,',
            titleHighlight: 'Pusat Kendali Acara.',
            description: 'Pantau kinerja operasional, kelola jadwal fasilitas, dan koordinasikan seluruh agenda acara perusahaan secara menyeluruh dan terintegrasi.',
            actionLabel: 'Kelola Semua Acara',
        },
        APPROVER: {
            eyebrow: 'Ruang Kerja Penyetuju',
            titlePrefix: 'Selamat Datang Penyetuju,',
            titleHighlight: 'Validasi & Persetujuan Acara.',
            description: 'Evaluasi kesiapan fasilitas, kebutuhan staf, dan berikan keputusan persetujuan untuk memastikan kelancaran setiap agenda operasional.',
            actionLabel: 'Buka Antrean Persetujuan',
        },
        PIC: {
            eyebrow: 'Ruang Kerja PIC Acara',
            titlePrefix: 'Selamat Datang PIC Acara,',
            titleHighlight: 'Rencanakan & Kelola Agenda.',
            description: 'Susun jadwal kegiatan, periksa ketersediaan lokasi dan staf, serta pantau status pengajuan acara Anda secara real-time.',
            actionLabel: 'Lihat Acara Saya',
        },
    }[role] || {
        eyebrow: 'Ruang Kerja Technolife',
        titlePrefix: 'Selamat Datang Kembali,',
        titleHighlight: 'Kalender & Operasional Acara.',
        description: 'Kelola agenda kegiatan, fasilitas lokasi, dan operasional acara terpadu dari satu tempat.',
        actionLabel: 'Lihat Aktivitas',
    };

    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return <>
        <DashboardHero
            eyebrow={roleHero.eyebrow}
            titlePrefix={roleHero.titlePrefix}
            titleHighlight={roleHero.titleHighlight}
            description={roleHero.description}
            actionLabel={roleHero.actionLabel}
            onAction={() => navigate(actionPage)}
            date={today}
        />
        <section className={role === 'PIC' ? 'pic-stats-grid' : 'stats-grid'}>{configurations.map(item => <StatCard key={item.key} label={item.label} count={item.count} active={dashboardFilter === item.key} onClick={() => setDashboardFilter(item.key)}/>)}</section>
        <section className="mt-6"><div className="card overflow-hidden"><div className="section-heading"><div><h2>{activeConfiguration.title}</h2><p>{activeConfiguration.description}</p></div><button className="text-button" onClick={() => navigate(actionPage)}>Lihat semua <ChevronRight size={16}/></button></div>{events.length ? <EventTable rows={events} open={setDetailId}/> : <EmptyState icon={ClipboardCheck} title={activeConfiguration.empty} description="Pilih kategori lain atau buka daftar lengkap untuk melihat acara lainnya."/>}</div></section>
        {role === 'ADMIN' && <OperationalAnalytics events={dashboardEvents}/>} 
    </>;
}

function useResource(url, dependencies = []) {
    const [state, setState] = useState({ loading: true, data: null, error: null }); const [version, setVersion] = useState(0);
    useEffect(() => { let active = true; setState(current => ({ ...current, loading: true, error: null })); api('get', url).then(data => active && setState({ loading: false, data, error: null })).catch(error => active && setState({ loading: false, data: null, error })); return () => { active = false; }; }, [url, version, ...dependencies]);
    return { ...state, reload: () => setVersion(value => value + 1) };
}

function DashboardHero({ eyebrow, titlePrefix = 'Selamat Datang Kembali,', titleHighlight = 'Ruang Kerja Acara.', description, actionLabel, onAction, date }) {
    return <section className="dashboard-hero">
        <div className="self-center">
            <div className="hero-badge"><span className="hero-badge-dot"/>{eyebrow}</div>
            <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-[32px] leading-tight">
                <span className="block text-ink">{titlePrefix}</span>
                <span className="block text-brand">{titleHighlight}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral sm:text-base">{description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <button className="btn btn-primary" onClick={onAction}>
                    {actionLabel}
                    <ChevronRight size={17}/>
                </button>
            </div>
        </div>
        <div className="hero-date">
            <div className="flex items-center gap-2.5 text-brand">
                <CalendarDays size={20}/>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral">Jadwal Hari Ini</span>
            </div>
            <p className="mt-3 text-base font-bold capitalize text-ink sm:text-lg">{date}</p>
            <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-neutral">
                <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                <span>Sistem Terhubung & Terintegrasi</span>
            </div>
        </div>
    </section>;
}

function ListToolbar({ children, single = false }) { return <div className={`list-toolbar ${single ? 'is-single' : ''}`}>{children}</div>; }
function SearchField({ className = '', compact = false, ...props }) { return <div className={`search-field ${className}`}><Search className="search-field-icon" size={compact ? 15 : 17}/><input className={`field search-field-input ${compact ? 'is-compact' : ''}`} type="search" {...props}/></div>; }
function PageHeader({ title, subtitle, action }) { return <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-[-.02em] text-ink sm:text-[30px] sm:leading-10">{uiText(title)}</h1><p className="mt-1 text-sm leading-6 text-neutral sm:text-base">{uiText(subtitle)}</p></div>{action}</header>; }
function StatCard({ label, count, accent, active = false, onClick }) { const content = <div className="flex h-full items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.06em] text-neutral">{label}</p><p className="mt-3 text-[32px] font-bold leading-10 tracking-tight text-ink">{count ?? 0}</p><p className="mt-2 text-xs text-neutral">Berdasarkan data terkini</p></div><span className={`stat-card-icon flex h-11 w-11 items-center justify-center rounded-xl ${accent || active ? 'bg-brand text-white shadow-sm' : 'bg-surface-container-low text-neutral'}`}><CalendarCheck size={20}/></span></div>; return onClick ? <button type="button" aria-pressed={active} onClick={onClick} className={`stat-card card is-interactive min-h-36 w-full p-6 text-left ${active ? 'is-active' : ''}`}>{content}</button> : <article className={`stat-card card min-h-36 p-6 ${accent ? 'is-accent' : ''}`}>{content}</article>; }

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
            ['rejected', 'Perlu Revisi', data.rejected, 'Pengajuan Perlu Revisi', 'Riwayat pengajuan yang diminta revisi.', 'Tidak ada pengajuan yang diminta revisi.'],
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

// Staff dependencies are bound once, before the root renders.
const StaffError = createStaffError({  });
const StaffDashboardSkeleton = createStaffDashboardSkeleton({ PageSkeleton, TableSkeleton, ListSkeleton });
const StaffScheduleTable = createStaffScheduleTable({ dateText, timeText, StatusBadge });
const StaffAssignmentDetail = createStaffAssignmentDetail({ useResource, Modal, PageSkeleton, StaffError, StatusBadge, Info, dateText, timeText });
const StaffAssignments = createStaffAssignments({ useResource, PageHeader, ListToolbar, SearchField, TableSkeleton, StaffError, dateText, timeText, StatusBadge, EmptyState, StaffAssignmentDetail });
const StaffDashboard = createStaffDashboard({ SessionContext, useResource, StaffDashboardSkeleton, StaffError, sortDashboardEvents, filterDashboardEvents, DashboardHero, StatCard, StaffScheduleTable, EmptyState, dateTimeText });

const eventFeatures = createEventFeatures({ useResource, SessionContext, PageHeader, ListToolbar, SearchField, Field, FormSection, Alert, Spinner, Modal, EmptyState, ErrorState, PageSkeleton, TableSkeleton, StatusBadge, Info, api, ToastContext, dateText, dateTimeText, timeText, uiText, STATUS });
const { EventList, EventTable, FullPageDetail, EventDetail, EventForm } = eventFeatures;
const sharedPages = createSharedPages({ useContext, useEffect, useState, SessionContext, useResource, PageSkeleton, ErrorState, PageHeader, EmptyState, EventDetail, StatusBadge, Field, TableSkeleton, AvailabilityGrid, api, ToastContext, ListSkeleton, Modal, dateText, dateTimeText, timeText, getEventStatusClass, STATUS, ROLE, Avatar, Info, Check });
const { CalendarPage, AvailabilityPage, Notifications, ProfilePage } = sharedPages;
const adminPages = createAdminPages({ useResource, SessionContext, PageHeader, ListToolbar, SearchField, Field, Alert, Spinner, Modal, EmptyState, ErrorState, TableSkeleton, ListSkeleton, StatusBadge, Info, api, ToastContext, ROLE, STATUS, EventDetail, EventForm, EventTable, DashboardHero, StatCard, Dashboard, filterDashboardEvents, sortDashboardEvents, dashboardMetricConfigurations, dateText, dateTimeText, timeText, uiText, Avatar, OperationalChart });
const { UserManagement, UserForm, VenueManagement, VenueForm, Reports, OperationalAnalytics } = adminPages;

function App() {
    const [user, setUser] = useState(window.__AUTH_USER__ !== undefined ? window.__AUTH_USER__ : undefined);
    useEffect(() => {
        if (window.__AUTH_USER__ === undefined) {
            api('get', '/me').then(setUser).catch(() => setUser(null));
        }
    }, []);
    if (user === undefined) return <div className="flex min-h-screen items-center justify-center"><Spinner/><span className="ml-3 text-sm font-semibold text-neutral">Memuat aplikasi…</span></div>;
    return <SessionContext.Provider value={{ user, setUser }}>{user ? <Shell user={user} setUser={setUser}/> : <LoginPage onLogin={setUser} api={api} Field={Field} Alert={Alert} Spinner={Spinner}/>}</SessionContext.Provider>;
}

try {
    const root = document.getElementById('app');
    if (!root) throw new Error('Elemen root aplikasi tidak ditemukan.');
    createRoot(root).render(<AppErrorBoundary><ToastProvider><App/></ToastProvider></AppErrorBoundary>);
} catch (error) {
    window.__showStartupError?.(error);
}
