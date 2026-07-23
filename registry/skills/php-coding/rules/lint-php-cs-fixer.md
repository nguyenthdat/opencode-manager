# lint-php-cs-fixer

> Use PHP-CS-Fixer or Laravel Pint for code style

## Why It Matters

Automated code style tools eliminate style debates and ensure consistency across the codebase. PHP-CS-Fixer is framework-agnostic; Laravel Pint is a wrapper with Laravel defaults. Run in CI to enforce on every commit.

## Bad

```php
<?php

// No CS fixer — inconsistent style
// class user {
//     public function GetData(){ $x=1;return $x;}
// }

class order extends Model { // No consistent style
    public string $Status;
    public function Process(): void {}
}
```

## Good

```php
<?php

// .php-cs-fixer.dist.php
$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        'declare_strict_types' => true,
        'strict_param' => true,
        'array_syntax' => ['syntax' => 'short'],
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'declare_equal_normalize' => ['space' => 'none'],
    ])
    ->setFinder($finder);

// pint.json (Laravel Pint)
{
    "preset": "laravel",
    "rules": {
        "declare_strict_types": true,
        "strict_param": true
    }
}

// CI: vendor/bin/php-cs-fixer fix --dry-run --diff
// CI: vendor/bin/pint --test
```

## See Also

- [lint-no-unused-imports](./lint-no-unused-imports.md)
- [proj-script-composer](./proj-script-composer.md)
