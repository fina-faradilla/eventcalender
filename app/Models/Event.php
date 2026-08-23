<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Event extends Model {
 protected $guarded=[]; protected function casts(): array{return ['event_date'=>'date:Y-m-d'];}
 public function creator(){return $this->belongsTo(User::class,'created_by');} public function venue(){return $this->belongsTo(Venue::class);} public function staff(){return $this->belongsToMany(User::class,'event_staff')->withPivot('responsibility')->withTimestamps();} public function approvals(){return $this->hasMany(Approval::class);}
 public function reminders(){return $this->hasMany(Reminder::class);}
}
