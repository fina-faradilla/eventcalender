<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Models\AppNotification;
use App\Models\Approval;
use App\Models\Event;
use App\Models\User;
use App\Models\Venue;
use App\Services\AdminNotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ApiController extends Controller
{
    private const TYPES = ['Meeting', 'Training', 'Seminar', 'Workshop', 'Exhibition', 'Gathering', 'Internal Event', 'External Event', 'Other'];

    public function __construct(private readonly AdminNotificationService $adminNotifications) {}

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $credentials['email'])->first();
        if (! $user || ! $user->is_active || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Email atau kata sandi tidak sesuai.'], 422);
        }
        Auth::login($user);
        $request->session()->regenerate();

        return $this->userPayload($user);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ['message' => 'Sesi berhasil diakhiri.'];
    }

    public function me(Request $request)
    {
        return $this->userPayload($request->user());
    }

    private function userPayload(User $user): array
    {
        return $user->only(['id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at']);
    }

    public function bootstrap(Request $request)
    {
        $staff = User::where('role', 'STAFF')->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'role']);
        if ($request->filled(['event_date', 'start_time', 'end_time'])) {
            $busyIds = DB::table('event_staff')->join('events', 'events.id', '=', 'event_staff.event_id')
                ->whereDate('events.event_date', $request->event_date)
                ->whereIn('events.status', [EventStatus::Pending->value, ...EventStatus::confirmed()])
                ->where('events.start_time', '<', $request->end_time)->where('events.end_time', '>', $request->start_time)
                ->when($request->event_id, fn ($query, $id) => $query->where('events.id', '!=', $id))
                ->pluck('event_staff.user_id')->unique();
            $staff->each(fn ($person) => $person->setAttribute('available', ! $busyIds->contains($person->id)));
        } else {
            $staff->each(fn ($person) => $person->setAttribute('available', true));
        }
        $venues = Venue::where('is_active', true)->orderBy('name')->get();
        if ($request->filled(['event_date', 'start_time', 'end_time'])) {
            $busyVenueIds = Event::whereDate('event_date', $request->event_date)
                ->whereIn('status', [EventStatus::Pending->value, ...EventStatus::confirmed()])
                ->where('start_time', '<', $request->end_time)->where('end_time', '>', $request->start_time)
                ->when($request->event_id, fn ($query, $id) => $query->whereKeyNot($id))
                ->whereNotNull('venue_id')->pluck('venue_id')->unique();
            $venues->each(fn ($venue) => $venue->setAttribute('available', ! $busyVenueIds->contains($venue->id)));
        } else {
            $venues->each(fn ($venue) => $venue->setAttribute('available', true));
        }

        return ['venues' => $venues, 'staff' => $staff, 'types' => self::TYPES];
    }

    public function events(Request $request)
    {
        $query = Event::with(['creator:id,name,email', 'venue', 'staff:id,name,email,role', 'approvals.approver:id,name'])->latest('event_date');
        $this->scopeVisibleEvents($query, $request->user());
        if ($request->boolean('calendar')) {
            $query->whereIn('status', EventStatus::confirmed());
        }
        foreach (['status', 'venue_id', 'event_type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->$field);
            }
        }
        if ($request->filled('pic')) {
            $query->where('created_by', $request->pic);
        }
        if ($request->filled('search')) {
            $query->where('event_name', 'like', '%'.$request->search.'%');
        }

        return $query->paginate(min(max((int) $request->input('per_page', 15), 5), 50));
    }

    private function scopeVisibleEvents(Builder $query, User $user): void
    {
        if ($user->role === 'PIC') {
            $query->where('created_by', $user->id);
        }
        if ($user->role === 'STAFF') {
            $query->whereHas('staff', fn ($staff) => $staff->where('users.id', $user->id));
        }
    }

    public function show(Request $request, Event $event)
    {
        $this->authorizeView($request->user(), $event);

        return $event->load(['creator:id,name,email', 'venue', 'staff:id,name,email,role', 'approvals.approver:id,name', 'reminders']);
    }

    private function rules(bool $submit): array
    {
        $required = fn () => $submit ? 'required' : 'nullable';

        return [
            'event_name' => [$required(), 'string', 'max:255'],
            'event_type' => [$required(), Rule::in(self::TYPES)],
            'custom_event_type' => ['nullable', $submit ? 'required_if:event_type,Other' : 'nullable', 'string', 'max:100'],
            'event_date' => [$required(), 'date', $submit ? 'after_or_equal:today' : 'nullable'],
            'start_time' => [$required(), 'date_format:H:i'], 'end_time' => [$required(), 'date_format:H:i', 'after:start_time'],
            'venue_id' => ['nullable', 'exists:venues,id'], 'custom_venue' => ['nullable', 'string', $submit ? 'required_without:venue_id' : 'nullable'],
            'participants_count' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'staff_required' => [$required(), 'integer', 'min:0', 'max:100'],
            'staff_ids' => ['array'], 'staff_ids.*' => ['integer', Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', 'STAFF')->where('is_active', true))],
            'description' => ['nullable', 'string'], 'notes' => ['nullable', 'string'],
        ];
    }

    public function store(Request $request)
    {
        $submit = $request->boolean('submit');
        $data = $request->validate($this->rules($submit));

        return DB::transaction(function () use ($request, $data, $submit) {
            $this->conflicts($data);
            $staff = $data['staff_ids'] ?? [];
            unset($data['staff_ids']);
            $data += ['created_by' => $request->user()->id, 'status' => $submit ? EventStatus::Pending->value : EventStatus::Draft->value];
            $event = Event::create($data);
            $event->staff()->sync($staff);
            $this->notifyAssignments($event, $staff);
            if ($staff !== []) {
                $this->adminNotifications->staffAssignmentUpdated($event);
            }
            AppNotification::create(['user_id' => $event->created_by, 'event_id' => $event->id, 'title' => $submit ? 'Event dikirim' : 'Draft tersimpan', 'message' => $submit ? "$event->event_name telah dikirim untuk persetujuan." : "$event->event_name tersimpan sebagai draft."]);
            if ($submit) {
                $this->notifyApprovers($event, false);
                $this->adminNotifications->eventSubmitted($event, $request->user());
            }

            return response()->json($event->load(['venue', 'staff', 'creator']), 201);
        });
    }

    public function update(Request $request, Event $event)
    {
        abort_unless($event->created_by === $request->user()->id, 403, 'Anda tidak dapat mengubah event ini.');
        abort_unless(in_array($event->status, [EventStatus::Draft->value, EventStatus::Rejected->value]), 409, 'Event tidak dapat diedit pada status saat ini.');
        $submit = $request->boolean('submit');
        $wasRejected = $event->status === EventStatus::Rejected->value;
        $data = $request->validate($this->rules($submit));

        return DB::transaction(function () use ($request, $data, $event, $submit, $wasRejected) {
            $this->conflicts($data, $event->id);
            $staff = $data['staff_ids'] ?? [];
            $previousStaff = $event->staff()->pluck('users.id')->map(fn ($id) => (int) $id)->sort()->values()->all();
            unset($data['staff_ids']);
            if ($submit) {
                $data['status'] = EventStatus::Pending->value;
            }
            $event->update($data);
            $event->staff()->sync($staff);
            $this->notifyAssignments($event, $staff);
            $currentStaff = collect($staff)->map(fn ($id) => (int) $id)->unique()->sort()->values()->all();
            if ($previousStaff !== $currentStaff) {
                $this->adminNotifications->staffAssignmentUpdated($event);
            }
            if ($submit && $wasRejected) {
                Approval::create(['event_id' => $event->id, 'approver_id' => $request->user()->id, 'status' => 'RESUBMITTED']);
            }
            if ($submit) {
                $this->notifyApprovers($event, $wasRejected);
                AppNotification::create(['user_id' => $event->created_by, 'event_id' => $event->id, 'title' => $wasRejected ? 'Event dikirim ulang' : 'Event dikirim', 'message' => "$event->event_name menunggu persetujuan."]);
                $this->adminNotifications->eventSubmitted($event, $request->user(), $wasRejected);
            }

            return $event->load(['venue', 'staff', 'creator', 'approvals.approver']);
        });
    }

    private function conflicts(array $data, ?int $ignore = null): void
    {
        if (empty($data['event_date']) || empty($data['start_time']) || empty($data['end_time'])) {
            return;
        }
        $overlap = Event::whereDate('event_date', $data['event_date'])->whereIn('status', [EventStatus::Pending->value, ...EventStatus::confirmed()])
            ->where('start_time', '<', $data['end_time'])->where('end_time', '>', $data['start_time'])->when($ignore, fn ($q, $id) => $q->whereKeyNot($id));
        if (! empty($data['venue_id']) && ($hit = (clone $overlap)->where('venue_id', $data['venue_id'])->with('venue')->first())) {
            abort(409, ($hit->venue->name ?? 'Venue')." sudah digunakan pada {$hit->start_time} - {$hit->end_time}.");
        }
        if (! empty($data['staff_ids']) && ($hit = (clone $overlap)->whereHas('staff', fn ($q) => $q->whereIn('users.id', $data['staff_ids']))->first())) {
            abort(409, "Staff yang dipilih sudah memiliki event pada {$hit->start_time} - {$hit->end_time}.");
        }
    }

    private function notifyApprovers(Event $event, bool $resubmitted): void
    {
        foreach (User::where('role', 'APPROVER')->where('is_active', true)->get() as $user) {
            AppNotification::create(['user_id' => $user->id, 'event_id' => $event->id, 'title' => $resubmitted ? 'Event diajukan ulang' : 'Persetujuan baru', 'message' => "$event->event_name membutuhkan persetujuan Anda."]);
        }
    }

    private function notifyAssignments(Event $event, array $staffIds): void
    {
        foreach (array_unique($staffIds) as $id) {
            AppNotification::firstOrCreate(['user_id' => $id, 'event_id' => $event->id, 'title' => 'Penugasan event'], ['message' => "Anda ditugaskan pada $event->event_name."]);
        }
    }

    public function decide(Request $request, Event $event)
    {
        abort_unless($event->status === EventStatus::Pending->value, 409, 'Event tidak lagi menunggu persetujuan.');
        $data = $request->validate(['decision' => ['required', Rule::in(['APPROVE', 'REJECT'])], 'rejection_reason' => ['nullable', 'required_if:decision,REJECT', 'string', 'min:5']]);
        $approved = $data['decision'] === 'APPROVE';
        DB::transaction(function () use ($request, $event, $data, $approved) {
            $event->update(['status' => $approved ? EventStatus::Scheduled->value : EventStatus::Rejected->value]);
            Approval::create(['event_id' => $event->id, 'approver_id' => $request->user()->id, 'status' => $approved ? 'APPROVED' : 'REJECTED', 'rejection_reason' => $data['rejection_reason'] ?? null, 'approved_at' => $approved ? now() : null]);
            AppNotification::create(['user_id' => $event->created_by, 'event_id' => $event->id, 'title' => $approved ? 'Event disetujui' : 'Event ditolak', 'message' => $approved ? "$event->event_name telah masuk jadwal." : "{$event->event_name} ditolak: {$data['rejection_reason']}"]);
            $this->adminNotifications->eventDecided($event, $request->user(), $approved);
        });

        return $event->fresh()->load(['venue', 'staff', 'creator', 'approvals.approver']);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $base = Event::query();
        $this->scopeVisibleEvents($base, $user);
        $counts = fn (string $status) => (clone $base)->where('status', $status)->count();
        $common = ['upcoming' => $this->scopeUpcoming(clone $base)->count(), 'today' => (clone $base)->whereDate('event_date', today())->count(), 'ongoing' => $counts(EventStatus::Ongoing->value), 'completed' => $counts(EventStatus::Completed->value)];

        return match ($user->role) {
            'PIC' => $common + ['draft' => $counts('DRAFT'), 'pending' => $counts('PENDING_APPROVAL'), 'approved' => (clone $base)->whereIn('status', EventStatus::confirmed())->count(), 'rejected' => $counts('REJECTED')],
            'APPROVER' => $common + ['pending' => $counts('PENDING_APPROVAL'), 'approved' => Approval::where('approver_id', $user->id)->where('status', 'APPROVED')->count(), 'rejected' => Approval::where('approver_id', $user->id)->where('status', 'REJECTED')->count()],
            'STAFF' => $common + ['assigned' => (clone $base)->count()],
            default => $common + ['total' => Event::count(), 'pending' => Event::where('status', 'PENDING_APPROVAL')->count(), 'approved' => Event::whereIn('status', EventStatus::confirmed())->count(), 'staff' => User::where('role', 'STAFF')->where('is_active', true)->count(), 'venues' => Venue::where('is_active', true)->count()],
        };
    }

    private function scopeUpcoming(Builder $query): Builder
    {
        $now = now();

        return $query->where('status', EventStatus::Scheduled->value)->where(function (Builder $query) use ($now) {
            $query->whereDate('event_date', '>', $now->toDateString())
                ->orWhere(fn (Builder $today) => $today->whereDate('event_date', $now->toDateString())->where('start_time', '>', $now->format('H:i:s')));
        });
    }

    public function staffDashboard(Request $request)
    {
        $base = $this->staffEventQuery($request->user());

        return [
            'stats' => [
                'assigned' => (clone $base)->count(),
                'today' => (clone $base)->whereDate('event_date', today())->count(),
                'upcoming' => $this->scopeUpcoming(clone $base)->count(),
                'completed' => (clone $base)->where('status', EventStatus::Completed->value)->count(),
            ],
            'schedule' => $this->scopeUpcoming(clone $base)->with(['venue', 'creator:id,name'])->orderBy('event_date')->orderBy('start_time')->limit(5)->get(),
            'notifications' => AppNotification::where('user_id', $request->user()->id)->latest()->limit(4)->get(),
        ];
    }

    public function staffAssignments(Request $request)
    {
        $query = $this->staffEventQuery($request->user())->with(['venue', 'creator:id,name']);
        if ($request->filled('search')) {
            $query->where('event_name', 'like', '%'.$request->search.'%');
        }
        $filter = strtolower((string) $request->input('filter', 'all'));
        if ($filter === 'upcoming') {
            $this->scopeUpcoming($query);
        }
        if ($filter === 'ongoing') {
            $query->where('status', EventStatus::Ongoing->value);
        }
        if ($filter === 'completed') {
            $query->where('status', EventStatus::Completed->value);
        }

        return $query->orderBy('event_date')->orderBy('start_time')->paginate(min(max((int) $request->input('per_page', 10), 5), 50));
    }

    public function staffAssignment(Request $request, Event $event)
    {
        $this->authorizeView($request->user(), $event);

        return $event->load(['creator:id,name,email', 'venue', 'staff:id,name,email,role', 'approvals.approver:id,name', 'reminders']);
    }

    public function staffCalendar(Request $request)
    {
        return $this->staffEventQuery($request->user())->with(['venue'])->whereIn('status', EventStatus::confirmed())->orderBy('event_date')->get();
    }

    private function staffEventQuery(User $user): Builder
    {
        return Event::query()->whereHas('staff', fn ($staff) => $staff->where('users.id', $user->id))
            ->with(['staff' => fn ($staff) => $staff->where('users.id', $user->id)]);
    }

    public function notifications(Request $request)
    {
        $query = AppNotification::where('user_id', $request->user()->id);
        $page = (clone $query)->latest()->paginate(30)->toArray();

        return $page + ['unread_count' => (clone $query)->whereNull('read_at')->count()];
    }

    public function readAllNotifications(Request $request)
    {
        $updated = AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ['message' => 'Semua notifikasi telah ditandai dibaca.', 'updated_count' => $updated, 'unread_count' => 0];
    }

    public function deleteAllNotifications(Request $request)
    {
        $deleted = AppNotification::where('user_id', $request->user()->id)->delete();

        return ['message' => 'Semua notifikasi berhasil dihapus.', 'deleted_count' => $deleted, 'unread_count' => 0];
    }

    public function read(Request $request, AppNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['read_at' => now()]);

        return $notification;
    }

    public function users()
    {
        return User::latest()->get(['id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at']);
    }

    public function saveUser(Request $request, ?User $user = null)
    {
        $data = $request->validate(['name' => 'required|string|max:100', 'email' => ['required', 'email', Rule::unique('users')->ignore($user?->id)], 'role' => ['required', Rule::in(['PIC', 'APPROVER', 'ADMIN', 'STAFF'])], 'phone' => 'nullable|string|max:30', 'password' => [$user ? 'nullable' : 'required', 'min:8'], 'is_active' => 'required|boolean']);
        if (empty($data['password'])) {
            unset($data['password']);
        }

        return $user ? tap($user)->update($data) : User::create($data);
    }

    public function venues()
    {
        return Venue::latest()->get();
    }

    public function saveVenue(Request $request, ?Venue $venue = null)
    {
        $data = $request->validate(['name' => ['required', 'string', Rule::unique('venues')->ignore($venue?->id)], 'type' => 'nullable|string|max:80', 'location' => 'nullable|string|max:150', 'capacity' => 'nullable|integer|min:1', 'is_active' => 'required|boolean']);

        return $venue ? tap($venue)->update($data) : Venue::create($data);
    }

    private function authorizeView(User $user, Event $event): void
    {
        if ($user->role === 'PIC') {
            abort_unless($event->created_by === $user->id, 403, 'Anda tidak memiliki akses ke event ini.');
        }
        if ($user->role === 'STAFF') {
            abort_unless($event->staff()->where('users.id', $user->id)->exists(), 403, 'Anda tidak ditugaskan pada event ini.');
        }
    }
}
