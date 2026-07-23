# name-no-abbrev

> Avoid abbreviations except well-known (id, url, db)

## Why It Matters

Abbreviations force readers to mentally expand them, slowing comprehension. `$customerAddress` is immediately clear; `$custAddr` requires translation. Exceptions: widely recognized abbreviations like `id`, `url`, `db`, `api`, `http`.

## Bad

```php
<?php

declare(strict_types=1);

class CustSvc {
    private string $custName;
    private string $addrLn1;
    private int $qty;

    public function calcTot(): float {}
    public function genRpt(int $custId): void {}
}

$custAddr = $cust->getAddr();
$msgTxt = 'Hello';
```

## Good

```php
<?php

declare(strict_types=1);

class CustomerService {
    private string $customerName;
    private string $addressLine1;
    private int $quantity;

    public function calculateTotal(): float {}
    public function generateReport(int $customerId): void {}
}

// Well-known abbreviations are fine
$customerId = $customer->getId();
$apiUrl = config('services.api.url');
$dbHost = env('DB_HOST');

$customerAddress = $customer->getAddress();
$messageText = 'Hello';
```

## See Also

- [name-methods-vars-camelCase](./name-methods-vars-camelCase.md)
- [name-method-verb-object](./name-method-verb-object.md)
