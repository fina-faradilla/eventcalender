<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event; // <-- Pastikan yang ini
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Keycloak\Provider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \App\Models\Event::observe(\App\Observers\EventObserver::class);

        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('keycloak', Provider::class);
        });
    }
}