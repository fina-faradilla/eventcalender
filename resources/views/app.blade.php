<!doctype html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Kalender Acara Technolife</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app">
        <main id="startup-fallback" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Poppins','Montserrat',sans-serif;text-align:center;color:#4A4A4A;background-color:#F8F9FA">
            <div><strong style="color:#9E0A2B;font-size:18px">Memuat aplikasi&hellip;</strong><p style="margin-top:8px;font-size:14px;color:#4A4A4A">Mohon tunggu sebentar.</p></div>
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
            if (root && document.getElementById('startup-fallback')) {
                root.innerHTML = '<main id="application-error" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:\'Poppins\',\'Montserrat\',sans-serif;text-align:center;color:#4A4A4A;background-color:#F8F9FA"><div><strong style="color:#9E0A2B;font-size:18px">Aplikasi gagal dimuat.</strong><p style="margin-top:8px;font-size:14px;color:#4A4A4A">Muat ulang halaman atau periksa koneksi Anda.</p></div></main>';
            }
        };
        window.addEventListener('error', function (event) {
            if (document.getElementById('startup-fallback')) {
                window.__showStartupError(event.error || event.message);
            }
        });
        window.addEventListener('unhandledrejection', function (event) {
            if (document.getElementById('startup-fallback')) {
                window.__showStartupError(event.reason);
            }
        });
    </script>
</body>
</html>
