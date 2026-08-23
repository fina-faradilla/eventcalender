<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AppNotification extends Model { protected $table='notifications'; protected $guarded=[]; protected function casts():array{return ['read_at'=>'datetime'];} }
