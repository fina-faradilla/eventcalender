import React, { useState, useContext } from 'react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffAssignmentDetail({ useResource, Modal, PageSkeleton, StaffError, StatusBadge, Info, dateText, timeText }) {
function StaffAssignmentDetail({ id, close }) {
    const resource = useResource(`/staff/assignments/${id}`);
    if (resource.loading) return <Modal title="Detail Penugasan" close={close}><PageSkeleton cards={2}/></Modal>;
    if (resource.error) return <Modal title="Detail Penugasan" close={close}><StaffError retry={resource.reload}/></Modal>;
    const event = resource.data;
    return <Modal title={event.event_name} subtitle="Penugasan acara Anda" close={close}><div className="mb-5"><StatusBadge status={event.status}/></div><dl className="grid gap-5 border-y border-line py-5 sm:grid-cols-2"><Info label="Tanggal" value={dateText(event.event_date)}/><Info label="Waktu" value={`${timeText(event.start_time)}–${timeText(event.end_time)}`}/><Info label="Lokasi" value={event.venue?.name || event.custom_venue}/><Info label="Peran" value={event.staff?.[0]?.pivot?.responsibility || 'Staf Acara'}/><Info label="PIC Acara" value={event.creator?.name}/></dl><div className="mt-5"><h3 className="font-semibold">Deskripsi</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral">{event.description || 'Tidak ada deskripsi.'}</p></div></Modal>;
}

    return StaffAssignmentDetail;
}
