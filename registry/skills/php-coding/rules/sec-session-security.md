# sec-session-security

> Use secure, httponly, samesite cookie flags

## Why It Matters

Session cookies without proper flags can be stolen via XSS (no httponly), intercepted over HTTP (no secure), or sent in cross-site requests (no samesite). Set all three flags on session cookies for defense in depth.

## Bad

```php
<?php

declare(strict_types=1);

// Insecure session configuration
session_start();

// php.ini — no flags
session.cookie_secure = 0
session.cookie_httponly = 0
session.cookie_samesite =
```

## Good

```php
<?php

declare(strict_types=1);

// php.ini
session.cookie_secure = 1      // HTTPS only
session.cookie_httponly = 1    // Not accessible via JavaScript
session.cookie_samesite = "Lax" // Protect against CSRF

// Programmatic
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.example.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Laravel config/session.php
'secure' => env('SESSION_SECURE_COOKIE', true),
'http_only' => true,
'same_site' => 'lax',

// Regenerate ID after login to prevent session fixation
session_regenerate_id(true);
```

## See Also

- [sec-csrf-token](./sec-csrf-token.md)
- [sec-xss-prevention](./sec-xss-prevention.md)
