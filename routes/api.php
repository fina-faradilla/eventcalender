<?php
use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;
Route::post('/login',[ApiController::class,'login']);
Route::middleware('auth')->group(function(){
 Route::post('/logout',[ApiController::class,'logout']); Route::get('/me',[ApiController::class,'me']); Route::get('/bootstrap',[ApiController::class,'bootstrap']); Route::get('/dashboard',[ApiController::class,'dashboard']);
 Route::get('/events',[ApiController::class,'events']); Route::post('/events',[ApiController::class,'store'])->middleware('role:PIC'); Route::get('/events/{event}',[ApiController::class,'show']); Route::put('/events/{event}',[ApiController::class,'update'])->middleware('role:PIC');
 Route::post('/events/{event}/decision',[ApiController::class,'decide'])->middleware('role:APPROVER'); Route::post('/events/{event}/reminders',[ApiController::class,'remind']);
 Route::get('/notifications',[ApiController::class,'notifications']); Route::post('/notifications/{notification}/read',[ApiController::class,'read']);
 Route::get('/users',[ApiController::class,'users'])->middleware('role:ADMIN'); Route::post('/users/{user?}',[ApiController::class,'saveUser'])->middleware('role:ADMIN'); Route::get('/venues',[ApiController::class,'venues'])->middleware('role:ADMIN'); Route::post('/venues/{venue?}',[ApiController::class,'saveVenue'])->middleware('role:ADMIN');
 Route::prefix('staff')->middleware('role:STAFF')->group(function(){
  Route::get('/dashboard',[ApiController::class,'staffDashboard']);
  Route::get('/assignments',[ApiController::class,'staffAssignments']);
  Route::get('/assignments/{event}',[ApiController::class,'staffAssignment']);
  Route::get('/calendar',[ApiController::class,'staffCalendar']);
  Route::get('/notifications',[ApiController::class,'notifications']);
 });
});
