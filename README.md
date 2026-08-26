# Technolife Event Reservation & Management System

Laravel 13 + React 19 + Tailwind CSS 4 MVP for internal event proposals, approval, scheduling, staff assignment, notifications, reminders, and administration.

## Local setup

```powershell
composer install
npm.cmd install
Copy-Item .env.example .env
php artisan key:generate
```

Create the MySQL database `technolife_events`, adjust `.env` credentials, then run:

```powershell
php artisan migrate --seed
```

## Local development

Use two terminals:

Terminal 1 (Laravel server, scheduler, and queue worker):

```powershell
composer run dev
```

Terminal 2 (Vite frontend):

```powershell
npm.cmd run dev
```

Then open <http://127.0.0.1:8000>. The Composer command keeps `php artisan schedule:work` and `php artisan queue:work` running automatically, so reminders and queued emails do not require separate terminals. Configure SMTP in `.env` for external email delivery; with `MAIL_MAILER=log`, messages are written to the application log.

For a production frontend bundle:

```powershell
npm.cmd run build
```

Tests use isolated in-memory SQLite:

```powershell
php artisan test
```

## Demo accounts

All demo accounts use password `password`.

- PIC: `pic@technolife.test`
- Approver: `approver@technolife.test`
- Admin: `admin@technolife.test`

See [MVP_ASSUMPTIONS.md](MVP_ASSUMPTIONS.md) for palette tokens and business assumptions.
