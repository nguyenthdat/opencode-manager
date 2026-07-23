# name-abstract-prefix

> Prefix abstract classes with Abstract

## Why It Matters

The `Abstract` prefix signals that a class cannot be instantiated directly and is meant to be extended. This is especially helpful in IDEs and code review — you immediately know a class is abstract without checking the declaration.

## Bad

```php
<?php

declare(strict_types=1);

abstract class Controller {}
abstract class Repository {}

class UserController extends Controller {}
class UserRepository extends Repository {}

// Is Controller a class or abstract? Must look at declaration
```

## Good

```php
<?php

declare(strict_types=1);

abstract class AbstractController {}
abstract class AbstractRepository {}

class UserController extends AbstractController {}
class UserRepository extends AbstractRepository {}

// Abstract prefix — immediately clear it's not instantiable
```

## See Also

- [name-classes-PascalCase](./name-classes-PascalCase.md)
- [name-traits-suffix](./name-traits-suffix.md)
