<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Kalender Acara Technolife</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app">
        <main id="startup-fallback" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#374151">
            <div><strong>Memuat aplikasi&hellip;</strong><p style="margin-top:8px;font-size:14px">Mohon tunggu sebentar.</p></div>
        </main>
    </div>
    @php
        $authUser = auth()->user() ? [
            'id' => auth()->user()->id,
            'name' => auth()->user()->name,
            'email' => auth()->user()->email,
            'role' => auth()->user()->role,
            'phone' => auth()->user()->phone,
            'is_active' => auth()->user()->is_active,
            'created_at' => (string) auth()->user()->created_at,
        ] : null;
        $sessionError = $errors->first('email') ?: ($errors->first() ?: session('error'));
    @endphp
    <script>
        window.__APP_DEBUG__ = @json((bool) config('app.debug'));
        window.__AUTH_USER__ = @json($authUser);
        window.__SESSION_ERROR__ = @json($sessionError);
        window.__showStartupError = function (error) {
            if (window.__APP_DEBUG__) console.error('Application startup failed:', error);
            var root = document.getElementById('app');
            if (root && !document.getElementById('application-error')) {
                root.innerHTML = '<main id="application-error" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#374151"><div><strong>Aplikasi gagal dimuat.</strong><p style="margin-top:8px;font-size:14px">Muat ulang halaman atau periksa koneksi Anda.</p></div></main>';
            }
        };
        window.addEventListener('error', function (event) { window.__showStartupError(event.error || event.message); });
        window.addEventListener('unhandledrejection', function (event) { window.__showStartupError(event.reason); });
    </script>
</body>
</html>
