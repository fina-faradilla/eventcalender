import React, { useState, useContext } from 'react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffScheduleTable({ dateText, timeText, StatusBadge }) {
function StaffScheduleTable({ rows, open }) {
    return <div className="mobile-scroll"><table className="data-table w-full min-w-[650px] text-xs"><thead><tr><th>Nama Acara</th><th>Tanggal & Waktu</th><th>Lokasi</th><th>Penugasan</th><th>Status</th></tr></thead><tbody>{rows.map(event => <tr key={event.id} className="cursor-pointer" onClick={() => open(event.id)}><td className="font-semibold">{event.event_name}</td><td>{dateText(event.event_date)}<span className="block text-[11px] text-neutral">{timeText(event.start_time)}–{timeText(event.end_time)}</span></td><td>{event.venue?.name || event.custom_venue || '—'}</td><td>{event.staff?.[0]?.pivot?.responsibility || 'Staf Acara'}</td><td><StatusBadge status={event.status}/></td></tr>)}</tbody></table></div>;
}

    return StaffScheduleTable;
}
