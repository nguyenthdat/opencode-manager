# proj-composer-autoload

> Configure PSR-4 autoloading in composer.json

## Why It Matters

PSR-4 autoloading maps namespaces to directories, enabling automatic class loading. Configure it once in `composer.json` and Composer handles the rest. This is the standard for all modern PHP projects.

## Bad

```php
<?php

# Project without autoloading
# require_once 'src/Models/User.php';
# require_once 'src/Services/PaymentService.php';
# require_once 'src/Controllers/UserController.php';
# require_once 'vendor/autoload.php';

# Or manual classmap
{
    "autoload": {
        "classmap": ["src/"]
    }
}
```

## Good

```php
<?php

{
    "autoload": {
        "psr-4": {
            "App\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "App\Tests\": "tests/"
        }
    }
}

// Directory structure matches:
// src/Models/User.php -> namespace App\Models;
// src/Services/PaymentService.php -> namespace App\Services;
// src/Controllers/UserController.php -> namespace App\Controllers;

// Run after changes:
// composer dump-autoload
```

## See Also

- [proj-namespace-match-dir](./proj-namespace-match-dir.md)
- [proj-src-tests-separate](./proj-src-tests-separate.md)
