# MVP assumptions

- One shared approver pool reviews all submitted events; multi-level approval is future scope.
- Approval immediately transitions an event to `SCHEDULED` while retaining `APPROVED` as a supported centralized status.
- Only drafts and rejected events can be edited. Admin has no approval override.
- Pending and confirmed events reserve venues/staff; adjacent intervals such as 09:00–12:00 and 12:00–15:00 do not conflict.
- Lifecycle transitions to ongoing/completed/cancelled remain manual future operations.
- Email and WhatsApp are persisted mock-channel activity only; no external messages are sent.
- The default development database is MySQL. PHPUnit uses its isolated SQLite in-memory configuration.

# Palette tokens

- Primary/accent/danger: `#DC143C`
- Primary hover/warning: `#B81032`
- Secondary/text: `#121212`
- Neutral/status-success/info: `#4A4A4A`
- Canvas: `#FAFAFA`; surface: `#FFFFFF`; border: `#E5E1E2`; primary tint: `#F8D0D8`
