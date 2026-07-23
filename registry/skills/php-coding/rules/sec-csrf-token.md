# sec-csrf-token

> Include CSRF token on all state-changing forms

## Why It Matters

Cross-Site Request Forgery (CSRF) tricks users into submitting unwanted requests. Every POST/PUT/DELETE form must include a CSRF token. Frameworks like Laravel include this by default — ensure you use `@csrf` or the equivalent.

## Bad

```php
<?php

declare(strict_types=1);

// No CSRF protection
<form method="POST" action="/users/delete">
    <input type="hidden" name="user_id" value="<?= $user->id ?>">
    <button type="submit">Delete</button>
</form>

// API endpoint — no CSRF check
Route::post('/orders', [OrderController::class, 'store']);
```

## Good

```php
<?php

declare(strict_types=1);

// Blade — CSRF token included
<form method="POST" action="/users/delete">
    @csrf
    <input type="hidden" name="user_id" value="{{ $user->id }}">
    <button type="submit">Delete</button>
</form>

// API route excluded from CSRF (stateless API using tokens)
Route::post('/orders', [OrderController::class, 'store'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// For SPA — use sanctum/cookie-based auth with CSRF
// axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').content;
```

## See Also

- [sec-xss-prevention](./sec-xss-prevention.md)
- [sec-session-security](./sec-session-security.md)
