import React, { useState, useContext } from 'react';
import { ChevronRight, ClipboardCheck, Bell } from 'lucide-react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffDashboard({ SessionContext, useResource, StaffDashboardSkeleton, StaffError, sortDashboardEvents, filterDashboardEvents, DashboardHero, StatCard, StaffScheduleTable, EmptyState, dateTimeText }) {
function staffMetricConfigurations(data) { return [
    { key: 'all', label: 'Acara yang Ditugaskan', count: data.assigned, title: 'Semua Penugasan', empty: 'Saat ini Anda belum memiliki penugasan acara.' },
    { key: 'today', label: 'Penugasan Hari Ini', count: data.today, title: 'Penugasan Hari Ini', empty: 'Tidak ada penugasan hari ini.' },
    { key: 'upcoming', label: 'Penugasan Mendatang', count: data.upcoming, title: 'Penugasan Mendatang', empty: 'Belum ada penugasan mendatang.' },
    { key: 'completed', label: 'Penugasan Selesai', count: data.completed, title: 'Penugasan Selesai', empty: 'Belum ada penugasan selesai.' },
]; }

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

    return StaffDashboard;
}
