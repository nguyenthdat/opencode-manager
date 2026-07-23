# proj-src-tests-separate

> Use `src/` and `tests/` directory structure

## Why It Matters

Separating source code from tests keeps the project organized, simplifies autoloading configuration, and makes deployment tooling straightforward (exclude `tests/` from production builds). This is the PHP ecosystem standard.

## Bad

```php
<?php

// Mixed source and tests
// project/
//   User.php
//   UserTest.php
//   PaymentService.php
//   PaymentServiceTest.php
//   index.php

// No clear separation — hard to deploy only source
```

## Good

```php
<?php

project/
  src/
    Models/
      User.php
    Services/
      PaymentService.php
    Controllers/
      OrderController.php
  tests/
    Unit/
      Models/
        UserTest.php
      Services/
        PaymentServiceTest.php
    Feature/
      Controllers/
        OrderControllerTest.php
  config/
    app.php
  database/
    migrations/
  public/
    index.php
  composer.json
```

## See Also

- [proj-composer-autoload](./proj-composer-autoload.md)
- [proj-service-layer](./proj-service-layer.md)
