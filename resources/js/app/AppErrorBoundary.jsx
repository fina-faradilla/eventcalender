import React, { Component } from 'react';

export default class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error, details) {
        if (window.__APP_DEBUG__) console.error('React render failed:', error, details);
    }

    render() {
        if (this.state.failed) {
            return <main className="flex min-h-screen items-center justify-center p-6 text-center"><div><h1 className="text-lg font-bold">Aplikasi gagal dimuat.</h1><p className="mt-2 text-sm text-neutral">Muat ulang halaman atau periksa koneksi Anda.</p></div></main>;
        }

        return this.props.children;
    }
}
