# name-method-verb-object

> Start methods with verb (sendEmail, not emailSend)

## Why It Matters

Methods starting with a verb describe an action, making code self-documenting. `$service->sendEmail()` clearly describes what happens. Object-verb ordering reads unnaturally and is harder to scan.

## Bad

```php
<?php

declare(strict_types=1);

class ReportService {
    public function reportGenerate(): void {}
    public function dataExport(): array { return []; }
    public function userNotify(User $user): void {}
    public function orderProcess(Order $order): void {}
}
```

## Good

```php
<?php

declare(strict_types=1);

class ReportService {
    public function generateReport(): void {}
    public function exportData(): array { return []; }
    public function notifyUser(User $user): void {}
    public function processOrder(Order $order): void {}
}
```

## See Also

- [name-is-has-boolean](./name-is-has-boolean.md)
- [name-methods-vars-camelCase](./name-methods-vars-camelCase.md)
