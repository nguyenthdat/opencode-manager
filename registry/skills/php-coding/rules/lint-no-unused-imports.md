# lint-no-unused-imports

> Error on unused imports

## Why It Matters

Unused imports clutter code and suggest incomplete refactoring. PHP-CS-Fixer can auto-remove them. Make this a hard error in CI — unused imports indicate code was moved or deleted without cleaning up.

## Bad

```php
<?php

declare(strict_types=1);

use App\Models\User;
use App\Models\Order;    // Never used
use App\Services\Payment; // Never used
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Never used

class OrderController {
    public function index(Request $request) {
        return User::all();
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Http\Request;

class OrderController {
    public function index(Request $request) {
        return User::all();
    }
}

// .php-cs-fixer.dist.php — auto-remove
'no_unused_imports' => true,

// PHPStan catches unused imports
// phpstan.neon
parameters:
    level: 8

// CI check:
// vendor/bin/phpstan analyse
// PHPStan reports: Used property/method not found, unused imports
```

## See Also

- [lint-php-cs-fixer](./lint-php-cs-fixer.md)
- [lint-unused-private](./lint-unused-private.md)
