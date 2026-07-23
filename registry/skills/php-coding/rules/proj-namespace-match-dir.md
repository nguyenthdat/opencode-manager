# proj-namespace-match-dir

> Namespace must match directory structure (PSR-4)

## Why It Matters

PSR-4 autoloading relies on the namespace matching the directory path. If they diverge, autoloading fails or becomes unpredictable. Every class's namespace must match its location relative to the autoloaded base directory.

## Bad

```php
<?php

// File: src/Services/Payment/Gateway.php
// Wrong namespace — doesn't match directory
namespace App\Payment;

class Gateway {}

// File: src/controllers/UserController.php
namespace App\Http\Controllers; // Case mismatch: src/controllers != Controllers
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

// File: src/Services/Payment/Gateway.php
// Correct — matches directory structure
namespace App\Services\Payment;

class Gateway {}

// File: src/Http/Controllers/UserController.php
namespace App\Http\Controllers;

class UserController {}

// File: src/Models/Entities/User.php
namespace App\Models\Entities;

class User {}
```

## See Also

- [proj-composer-autoload](./proj-composer-autoload.md)
- [name-classes-PascalCase](./name-classes-PascalCase.md)
