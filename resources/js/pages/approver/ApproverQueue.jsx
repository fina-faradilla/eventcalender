import React from 'react';

// Approval queue delegates to the existing shared EventList implementation.
export default function ApproverQueue({ EventList, ...props }) {
    return <EventList {...props} role="APPROVER" page="pending" />;
}
