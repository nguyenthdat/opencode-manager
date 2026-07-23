# proj-env-example

> Commit `.env.example`, never `.env`

## Why It Matters

`.env` contains secrets (API keys, passwords) and environment-specific values. `.env.example` documents required environment variables without exposing secrets. New developers copy `.env.example` to `.env` and fill in values.

## Bad

```php
<?php

// .env committed to git — secrets exposed
# APP_KEY=base64:abc123realhash
# DB_PASSWORD=production_password
# STRIPE_SECRET=sk_live_production_key
# MAILGUN_KEY=key-production123

// No .env.example — new devs don't know required vars
```

## Good

```php
<?php

# .env.example (committed)
APP_NAME="My App"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=app
DB_USERNAME=root
DB_PASSWORD=

STRIPE_KEY=
STRIPE_SECRET=

# .gitignore
/.env
```

## See Also

- [sec-env-secrets](./sec-env-secrets.md)
- [proj-gitignore-standard](./proj-gitignore-standard.md)
