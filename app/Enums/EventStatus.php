<?php

namespace App\Enums;

enum EventStatus: string
{
    case Draft = 'DRAFT';
    case Pending = 'PENDING_APPROVAL';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
    case Scheduled = 'SCHEDULED';
    case Ongoing = 'ONGOING';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';

    public static function confirmed(): array { return [self::Approved->value, self::Scheduled->value, self::Ongoing->value, self::Completed->value]; }
}
