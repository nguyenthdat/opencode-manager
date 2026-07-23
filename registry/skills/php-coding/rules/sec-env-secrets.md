# sec-env-secrets

> Store secrets in `.env` (not committed); never hardcode

## Why It Matters

Hardcoded secrets in source code end up in version control and are nearly impossible to rotate. Store API keys, passwords, and tokens in `.env` files, reference via `$_ENV` or `env()`, and never commit `.env` to version control.

## Bad

```php
<?php

declare(strict_types=1);

class Database {
    private string $dsn = 'mysql:host=prod-db.example.com;dbname=app';
    private string $user = 'admin';
    private string $pass = 'SuperSecret123'; // In source code!

    public function connect(): PDO {
        return new PDO($this->dsn, $this->user, $this->pass);
    }
}

$apiKey = 'sk_live_abc123xyz'; // Hardcoded API key
```

## Good

```php
<?php

declare(strict_types=1);

// .env (committed: .env.example with placeholder values)
// DB_DSN=mysql:host=127.0.0.1;dbname=app
// DB_USER=app
// DB_PASS=secret
// STRIPE_KEY=sk_live_xxx
// APP_KEY=base64:xxx

// .gitignore
// .env

class Database {
    public function connect(): PDO {
        return new PDO(
            dsn: $_ENV['DB_DSN'],
            username: $_ENV['DB_USER'],
            password: $_ENV['DB_PASS'],
            options: [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
    }
}

// Config validation on boot
$requiredEnv = ['DB_DSN', 'DB_USER', 'DB_PASS', 'APP_KEY'];
foreach ($requiredEnv as $key) {
    if (empty($_ENV[$key])) {
        throw new \RuntimeException("Missing required env var: {$key}");
    }
}
```

## See Also

- [proj-env-example](./proj-env-example.md)
- [proj-gitignore-standard](./proj-gitignore-standard.md)
