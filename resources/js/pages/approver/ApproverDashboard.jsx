import React from 'react';

// Approver dashboard delegates to the existing shared Dashboard implementation.
export default function ApproverDashboard({ Dashboard, ...props }) {
    return <Dashboard {...props} role="APPROVER" />;
}
