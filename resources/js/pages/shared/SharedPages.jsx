import React, { useContext, useEffect, useState } from 'react';
import { Bell, CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function createSharedPages(deps) {
    const {
        useContext, useEffect, useState, SessionContext, useResource,
        PageSkeleton, ErrorState, PageHeader, EmptyState, EventDetail,
        StatusBadge, Field, TableSkeleton, AvailabilityGrid, api,
        ToastContext, PageSkeleton: Skeleton, ListSkeleton, Modal,
        dateText, dateTimeText, timeText, getEventStatusClass, STATUS,
        ROLE, Avatar, Info, Check,
    } = deps;

    function CalendarPage() {
        const { user } = useContext(SessionContext);
        const resource = useResource(user.role === 'STAFF' ? '/staff/calendar' : '/events?calendar=1&per_page=50');
        const [month, setMonth] = useState(new Date());
        const [selected, setSelected] = useState(null);

        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];

        if (resource.loading) return <PageSkeleton cards={1} />;
        if (resource.error) return <ErrorState retry={resource.reload} />;

        const events = (user.role === 'STAFF' ? resource.data : resource.data?.data) || [];
        const today = new Date();

        return (
            <>
                <PageHeader title="Kalender Acara" subtitle="Jadwal acara yang telah disetujui dan terkonfirmasi." />
                <section className="card overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                aria-label="Bulan sebelumnya"
                                className="btn btn-secondary px-2.5"
                                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                aria-label="Bulan berikutnya"
                                className="btn btn-secondary px-2.5"
                                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button className="btn btn-secondary" onClick={() => setMonth(new Date())}>
                                Hari ini
                            </button>
                        </div>
                        <h2 className="text-base font-bold capitalize sm:text-lg">
                            {month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="calendar-legend text-xs text-neutral">
                            <span><i className="calendar-legend-dot calendar-event--scheduled" />Merah — Terjadwal</span>
                            <span><i className="calendar-legend-dot calendar-event--ongoing" />Aktif — Sedang berlangsung</span>
                            <span><i className="calendar-legend-dot calendar-event--completed" />Hijau — Selesai</span>
                        </div>
                    </div>
                    <div className="p-3 sm:p-5">
                        <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wide text-neutral sm:text-xs">
                            {'Min Sen Sel Rab Kam Jum Sab'.split(' ').map(day => (
                                <div className="py-2" key={day}>{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-l border-t border-line">
                            {cells.map((day, index) => {
                                const daily = day
                                    ? events.filter(item => {
                                        const [year, monthNumber, date] = item.event_date.split('-').map(Number);
                                        return year === month.getFullYear() && monthNumber - 1 === month.getMonth() && date === day;
                                    })
                                    : [];
                                const isToday = day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
                                return (
                                    <div
                                        key={index}
                                        className={`calendar-cell min-h-20 border-b border-r border-line p-1.5 sm:min-h-32 sm:p-2 ${isToday ? 'is-today' : ''}`}
                                    >
                                        <span className="calendar-day text-xs font-semibold">{day}</span>
                                        {daily.map(event => (
                                            <button
                                                aria-label={`${event.event_name}, ${timeText(event.start_time)}, ${STATUS[event.status] || event.status}`}
                                                title={`${event.event_name} · ${timeText(event.start_time)}–${timeText(event.end_time)}`}
                                                onClick={() => setSelected(event.id)}
                                                key={event.id}
                                                className={`calendar-event mt-1 block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-bold sm:text-xs ${getEventStatusClass(event.status)}`}
                                            >
                                                <span className="hidden sm:inline">{timeText(event.start_time)} · </span>
                                                {event.event_name}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
                {!events.length && (
                    <EmptyState icon={CalendarDays} title="Belum ada acara terjadwal" description="Acara akan muncul setelah disetujui." />
                )}
                {selected && (
                    <EventDetail id={selected} role={user.role} close={() => setSelected(null)} changed={resource.reload} />
                )}
            </>
        );
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

        return (
            <>
                <PageHeader
                    title={isVenue ? 'Ketersediaan Lokasi' : 'Ketersediaan Staf'}
                    subtitle={isVenue ? 'Periksa penggunaan fasilitas dan potensi konflik pada jadwal nyata.' : 'Periksa kesiapan personel dan konflik penugasan pada jadwal nyata.'}
                />
                <section className="card mb-6 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Tanggal">
                            <input className="field" type="date" value={filters.event_date} onChange={e => setFilters({ ...filters, event_date: e.target.value })} />
                        </Field>
                        <Field label="Waktu mulai">
                            <input className="field" type="time" value={filters.start_time} onChange={e => setFilters({ ...filters, start_time: e.target.value })} />
                        </Field>
                        <Field label="Waktu selesai">
                            <input className="field" type="time" value={filters.end_time} onChange={e => setFilters({ ...filters, end_time: e.target.value })} />
                        </Field>
                    </div>
                </section>
                {resource.loading || eventResource.loading ? (
                    <TableSkeleton />
                ) : resource.error || eventResource.error ? (
                    <ErrorState retry={() => { resource.reload(); eventResource.reload(); }} />
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="availability-key available">{available} tersedia</span>
                            <span className="availability-key conflict">{rows.length - available} terpakai pada rentang terpilih</span>
                            <span className="availability-key">{events.length} pemesanan pada tanggal ini</span>
                        </div>
                        <div className="mobile-scroll">
                            <AvailabilityGrid rows={rows} events={events} mode={mode} />
                        </div>
                    </>
                )}
            </>
        );
    }

    function Notifications({ notificationsChanged }) {
        const { user } = useContext(SessionContext);
        const resource = useResource(user.role === 'STAFF' ? '/staff/notifications' : '/notifications');
        const toast = useContext(ToastContext);
        const [deletingAll, setDeletingAll] = useState(false);
        const [busy, setBusy] = useState(false);

        useEffect(() => {
            const timer = window.setInterval(resource.reload, 45000);
            return () => window.clearInterval(timer);
        }, []);

        const refresh = () => {
            resource.reload();
            notificationsChanged?.();
        };

        async function mark(item) {
            if (item.read_at) return;
            try {
                await api('post', `/notifications/${item.id}/read`);
                refresh();
            } catch (error) {
                toast(error.message, 'error');
            }
        }

        async function markAll() {
            setBusy(true);
            try {
                const result = await api('patch', '/notifications/read-all');
                toast(result.message);
                refresh();
            } catch (error) {
                toast(error.message, 'error');
            } finally {
                setBusy(false);
            }
        }

        async function removeAll() {
            setBusy(true);
            try {
                const result = await api('delete', '/notifications');
                setDeletingAll(false);
                toast(result.message);
                refresh();
            } catch (error) {
                toast(error.message, 'error');
            } finally {
                setBusy(false);
            }
        }

        const notifications = resource.data?.data || [];
        const unread = resource.data?.unread_count || 0;

        return (
            <>
                <PageHeader title="Notifikasi" subtitle="Pembaruan persetujuan, penugasan, dan pengingat jadwal." />
                {resource.loading ? (
                    <ListSkeleton />
                ) : resource.error ? (
                    <ErrorState retry={resource.reload} />
                ) : notifications.length ? (
                    <section className="card overflow-hidden">
                        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
                            <div>
                                <h2 className="text-base font-bold">Aktivitas terbaru</h2>
                                <p className="mt-1 text-xs text-neutral">Notifikasi yang belum dibaca ditandai warna crimson.</p>
                                <span className="badge mt-3">{unread} belum dibaca</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button className="btn btn-secondary min-h-9 px-3 py-2 text-xs" disabled={busy || unread === 0} onClick={markAll}>
                                    <Check size={15} />Tandai semua telah dibaca
                                </button>
                                <button className="btn btn-danger min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => setDeletingAll(true)}>
                                    Hapus semua notifikasi
                                </button>
                            </div>
                        </header>
                        <div className="divide-y divide-line">
                            {notifications.map(item => (
                                <button
                                    onClick={() => mark(item)}
                                    key={item.id}
                                    className={`flex w-full gap-4 p-4 text-left transition-colors hover:bg-canvas sm:p-5 ${item.read_at ? '' : 'notification-unread'}`}
                                >
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read_at ? 'bg-surface-container-low text-neutral' : 'bg-brand text-white'}`}>
                                        <Bell size={16} />
                                    </span>
                                    <span className="flex-1">
                                        <span className="flex flex-wrap items-start justify-between gap-2">
                                            <b className="text-sm">{item.title}</b>
                                            <time className="text-xs text-neutral">{dateTimeText(item.created_at)}</time>
                                        </span>
                                        <span className="mt-1 block text-sm leading-6 text-neutral">{item.message}</span>
                                        {!item.read_at && <span className="mt-2 block text-[11px] font-bold text-brand">Belum dibaca</span>}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                ) : (
                    <EmptyState icon={Bell} title="Belum ada notifikasi" description="Tidak ada notifikasi untuk ditampilkan." />
                )}
                {deletingAll && (
                    <Modal title="Hapus semua notifikasi?" close={() => !busy && setDeletingAll(false)} size="sm">
                        <p className="text-sm leading-6 text-neutral">Semua notifikasi pada akun Anda akan dihapus dan tindakan ini tidak dapat dibatalkan.</p>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button className="btn btn-secondary" disabled={busy} onClick={() => setDeletingAll(false)}>Batal</button>
                            <button className="btn btn-danger" disabled={busy} onClick={removeAll}>{busy ? 'Menghapus…' : 'Hapus semua'}</button>
                        </div>
                    </Modal>
                )}
            </>
        );
    }

    function ProfilePage() {
        const { user } = useContext(SessionContext);
        return (
            <>
                <PageHeader
                    title={user.role === 'STAFF' ? 'Pengaturan Akun' : 'Pengaturan Profil'}
                    subtitle={user.role === 'STAFF' ? 'Kelola informasi akun dan akses Technolife Anda.' : 'Informasi akun dan akses Technolife Anda.'}
                />
                <section className="profile-grid">
                    <aside className="card flex flex-col items-center p-6 text-center">
                        <Avatar name={user.name} large />
                        <h2 className="mt-5 text-xl font-semibold">{user.name}</h2>
                        <p className="mt-1 text-sm text-brand">{ROLE[user.role]}</p>
                        <span className="badge badge-approved mt-4">{user.is_active ? 'Akun Aktif' : 'Akun Nonaktif'}</span>
                    </aside>
                    <div className="card p-6">
                        <div className="border-b border-line pb-4">
                            <h2 className="section-title">Informasi Akun</h2>
                            <p className="mt-1 text-sm text-neutral">Data ini berasal dari akun terautentikasi Anda.</p>
                        </div>
                        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                            <Info label="Nama lengkap" value={user.name} />
                            <Info label="Peran" value={ROLE[user.role]} />
                            <div className="sm:col-span-2">
                                <Info label="Alamat email" value={user.email} />
                            </div>
                            <Info label="Nomor telepon" value={user.phone || 'Belum diatur'} />
                            <Info label="Status akun" value={user.is_active ? 'Aktif' : 'Nonaktif'} />
                        </dl>
                    </div>
                </section>
            </>
        );
    }

    return { CalendarPage, AvailabilityPage, Notifications, ProfilePage };
}
