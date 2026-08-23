import React from 'react';

const START_HOUR = 8;
const END_HOUR = 18;
const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
const minutes = value => { const [hour = 0, minute = 0] = String(value || '').split(':').map(Number); return hour * 60 + minute; };

export default function AvailabilityGrid({ rows, events, mode }) {
    const isVenue = mode === 'venue';
    const rangeMinutes = (END_HOUR - START_HOUR) * 60;
    const matches = (event, row) => isVenue ? Number(event.venue_id) === Number(row.id) : event.staff?.some(person => Number(person.id) === Number(row.id));
    return <section className="availability-timeline card overflow-hidden">
        <div className="timeline-head timeline-grid"><div className="timeline-resource">{isVenue ? 'Lokasi' : 'Anggota Staf'}</div>{hours.map(hour => <div key={hour} className="timeline-hour">{String(hour).padStart(2, '0')}:00</div>)}</div>
        {rows.map(row => { const bookings = events.filter(event => matches(event, row)); return <div className="timeline-row timeline-grid" key={row.id}>
            <div className="timeline-resource"><b>{row.name}</b><span>{isVenue ? `Kapasitas: ${row.capacity || '—'}` : row.email || 'Staf acara'}</span></div>
            <div className="timeline-track">{bookings.map(event => { const start = Math.max(START_HOUR * 60, minutes(event.start_time)); const end = Math.min(END_HOUR * 60, minutes(event.end_time)); if (end <= start) return null; const left = ((start - START_HOUR * 60) / rangeMinutes) * 100; const width = ((end - start) / rangeMinutes) * 100; return <button key={event.id} className={`timeline-booking ${event.status === 'PENDING_APPROVAL' ? 'is-tentative' : ''}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${event.event_name} · ${event.start_time}–${event.end_time}`}><b>{event.event_name}</b><span>{String(event.start_time).slice(0,5)}–{String(event.end_time).slice(0,5)}</span></button>; })}{!bookings.length && <span className="timeline-empty">Available</span>}</div>
        </div>; })}
        {!rows.length && <div className="p-8 text-center text-sm text-neutral">Sumber daya aktif tidak ditemukan.</div>}
    </section>;
}
