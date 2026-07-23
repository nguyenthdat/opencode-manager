# anti-classic-includes

> Don't use include/require for dependency loading

## Why It Matters

`include`/`require` for class loading was standard in PHP 4/5 — modern PHP uses Composer autoloading. Manual includes create load-order dependencies, make refactoring painful, and are incompatible with modern tooling. Use Composer autoloading exclusively.

## Bad

```php
<?php

// Old-style manual loading — fragile
require_once 'config.php';
require_once 'lib/Database.php';
require_once 'lib/Logger.php';
require_once 'models/User.php';
require_once 'models/Order.php';
require_once 'services/PaymentService.php';
require_once 'controllers/OrderController.php';

// Order matters — circular dependencies break
// Renaming a file breaks all includes
```

## Good

```php
<?php

// composer.json
{
    "autoload": {
        "psr-4": {
            "App\": "src/"
        }
    }
}

// Single entry point
require_once __DIR__ . '/vendor/autoload.php';

// All classes loaded automatically
use App\Services\PaymentService;
use App\Controllers\OrderController;

$service = new PaymentService();
$controller = new OrderController($service);

// Never manually include class files again
```

## See Also

- [proj-composer-autoload](./proj-composer-autoload.md)
- [proj-namespace-match-dir](./proj-namespace-match-dir.md)
