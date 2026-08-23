<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Reminder extends Model { protected $guarded=[]; protected function casts():array{return ['scheduled_at'=>'datetime','sent_at'=>'datetime'];} }
