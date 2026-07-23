# sec-cors-proper

> Configure CORS explicitly; never use wildcard in production

## Why It Matters

Wildcard CORS (`Access-Control-Allow-Origin: *`) allows any website to make authenticated requests from your users' browsers. Configure CORS to allow only trusted origins, especially for endpoints that use cookies or session authentication.

## Bad

```php
<?php

declare(strict_types=1);

// Wildcard CORS — any origin can call
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');

// In Laravel config/cors.php
'allowed_origins' => ['*'],
```

## Good

```php
<?php

declare(strict_types=1);

// Explicit origins
$allowedOrigins = [
    'https://app.example.com',
    'https://admin.example.com',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

// Laravel config/cors.php
'allowed_origins' => ['https://app.example.com'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
'supports_credentials' => true,
'max_age' => 86400,
```

## See Also

- [sec-hsts-header](./sec-hsts-header.md)
- [sec-session-security](./sec-session-security.md)
