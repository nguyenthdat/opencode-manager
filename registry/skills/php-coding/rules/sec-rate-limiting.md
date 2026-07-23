# sec-rate-limiting

> Implement rate limiting on auth endpoints

## Why It Matters

Without rate limiting, attackers can brute-force passwords, exhaust resources, or flood your API. Implement rate limiting on login, password reset, and API endpoints. Frameworks like Laravel provide built-in rate limiters.

## Bad

```php
<?php

declare(strict_types=1);

// No rate limiting — vulnerable to brute force
Route::post('/login', [LoginController::class, 'authenticate']);

// API with no limits
Route::get('/api/search', [SearchController::class, 'index']);
```

## Good

```php
<?php

declare(strict_types=1);

// Laravel — built-in rate limiter
Route::post('/login', [LoginController::class, 'authenticate'])
    ->middleware('throttle:5,1'); // 5 attempts per minute

// Custom rate limiter in RouteServiceProvider
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

// Login-specific limiter
RateLimiter::for('login', function (Request $request) {
    $key = Str::transliterate(Str::lower($request->input('email')) . '|' . $request->ip());
    return Limit::perMinute(5)->by($key)
        ->response(function () {
            return response('Too many attempts. Try again in 60 seconds.', 429);
        });
});
```

## See Also

- [sec-csrf-token](./sec-csrf-token.md)
- [sec-session-security](./sec-session-security.md)
