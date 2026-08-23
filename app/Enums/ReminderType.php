<?php

namespace App\Enums;

enum ReminderType: string
{
    case H7 = 'H7';
    case H3 = 'H3';
    case H1 = 'H1';
    case H1Hour = 'H1_HOUR';
}
