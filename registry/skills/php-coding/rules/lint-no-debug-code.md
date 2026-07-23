# lint-no-debug-code

> Forbid `dd()`, `var_dump()`, `die()` in committed code

## Why It Matters

Debug functions left in production code expose internals, create security risks (information disclosure), and break response formats. Use a pre-commit hook, PHPStan rule, or PHP-CS-Fixer to prevent them from being committed.

## Bad

```php
<?php

declare(strict_types=1);

class PaymentController {
    public function process(Request $request): JsonResponse {
        $payment = $request->input();

        dd($payment); // Left from debugging — crashes production
        var_dump($payment);
        die('here');

        return response()->json(['status' => 'ok']);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentController {
    public function process(Request $request): JsonResponse {
        $payment = $request->input();

        logger()->debug('Payment request', ['payment' => $payment]);

        return response()->json(['status' => 'ok']);
    }
}

// .php-cs-fixer.dist.php — prevent debug code
// Use no_debug_code rule or custom fixer

// PHPStan custom rule
// composer require --dev spaze/phpstan-disallowed-calls

// phpstan.neon
parameters:
    disallowedFunctionCalls:
        -
            function: 'dd()'
            message: 'Remove dd() before committing'
        -
            function: 'var_dump()'
            message: 'Use logger instead'
        -
            function: 'dump()'
            message: 'Remove dump() before committing'

// Pre-commit hook
// if grep -rq 'dd(' src/; then echo "dd() found!"; exit 1; fi
```

## See Also

- [test-no-only](./test-no-only.md)
- [err-throw-exceptions](./err-throw-exceptions.md)
