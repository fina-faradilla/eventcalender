import React, { useState, useContext } from 'react';

// Bind existing shared dependencies once; component identity stays stable.
export default function createStaffDashboardSkeleton({ PageSkeleton, TableSkeleton, ListSkeleton }) {
function StaffDashboardSkeleton() { return <><PageSkeleton cards={4}/><div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]"><div className="card"><TableSkeleton/></div><ListSkeleton/></div></>; }

    return StaffDashboardSkeleton;
}
