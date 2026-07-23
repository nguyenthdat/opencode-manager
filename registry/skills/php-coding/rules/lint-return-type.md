# lint-return-type

> Require return type declarations

## Why It Matters

Mandatory return types make code's contract explicit, enable static analysis, and prevent accidental return of wrong types. PHPStan/Psalm can enforce that all methods have return type declarations.

## Bad

```php
<?php

declare(strict_types=1);

class Calculator {
    // No return type — could return anything
    public function add($a, $b) {
        return $a + $b;
    }

    public function divide($a, $b) {
        if ($b === 0) {
            return 'Error'; // Sometimes string, sometimes float
        }
        return $a / $b;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class Calculator {
    public function add(int|float $a, int|float $b): int|float {
        return $a + $b;
    }

    /** @throws DivisionByZeroException */
    public function divide(int|float $a, int|float $b): float {
        if ($b === 0) {
            throw new DivisionByZeroException();
        }
        return $a / $b;
    }
}

// phpstan.neon — require return types
parameters:
    level: 8
    checkMissingReturnTypehint: true

// Psalm
// <MissingReturnType>
//     <errorLevelType="error"/>
// </MissingReturnType>
```

## See Also

- [lint-property-type](./lint-property-type.md)
- [type-parameter-return](./type-parameter-return.md)
