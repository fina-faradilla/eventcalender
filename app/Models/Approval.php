<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Approval extends Model { protected $guarded=[]; protected function casts():array{return ['approved_at'=>'datetime'];} public function approver(){return $this->belongsTo(User::class,'approver_id');} }
