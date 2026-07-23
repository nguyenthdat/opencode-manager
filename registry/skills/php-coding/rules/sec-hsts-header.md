# sec-hsts-header

> Enable HSTS headers in production

## Why It Matters

HTTP Strict Transport Security (HSTS) tells browsers to always use HTTPS for your domain, preventing SSL stripping attacks. Enable it in production with a long max-age and include subdomains if applicable.

## Bad

```php
<?php

declare(strict_types=1);

// No HSTS — user can access via HTTP
// Browser may send requests over HTTP first
```

## Good

```php
<?php

declare(strict_types=1);

// Apache
// Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

// Nginx
// add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

// PHP
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
}

// Laravel middleware
class HstsMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $response = $next($request);
        if (app()->environment('production')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload',
            );
        }
        return $response;
    }
}
```

## See Also

- [sec-cors-proper](./sec-cors-proper.md)
- [sec-session-security](./sec-session-security.md)
