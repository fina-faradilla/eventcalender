import React, { useState, useContext } from 'react';
import { X } from 'lucide-react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffError({  }) {
function StaffError({ retry, compact }) { return <div className={`flex flex-col items-center justify-center p-8 text-center ${compact ? 'min-h-48' : 'card min-h-64'}`}><X className="text-brand"/><h3 className="mt-4 font-semibold">Penugasan gagal dimuat.</h3><p className="mt-1 text-sm text-neutral">Silakan coba kembali.</p><button className="btn btn-secondary mt-4" onClick={retry}>Coba Lagi</button></div>; }

    return StaffError;
}
