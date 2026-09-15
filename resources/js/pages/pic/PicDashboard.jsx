import React from 'react';

// PIC uses the existing shared Dashboard component with its original role props.
export default function PicDashboard({ Dashboard, ...props }) {
    return <Dashboard {...props} role="PIC" />;
}
