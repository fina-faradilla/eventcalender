import React, { useState, useContext } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffAssignments({ useResource, PageHeader, ListToolbar, SearchField, TableSkeleton, StaffError, dateText, timeText, StatusBadge, EmptyState, StaffAssignmentDetail }) {
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

    return StaffAssignments;
}
