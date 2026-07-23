# anti-god-class

> Don't create classes with many responsibilities

## Why It Matters

God classes accumulate unrelated functionality, becoming impossible to understand, test, or refactor. Split them by responsibility — each class should do one thing well. A class with 20+ public methods or 500+ lines is a god class.

## Bad

```php
<?php

declare(strict_types=1);

class UserManager {
    public function createUser(array $data): User { /* ... */ }
    public function deleteUser(int $id): void { /* ... */ }
    public function sendWelcomeEmail(User $user): void { /* ... */ }
    public function generateInvoice(User $user): Invoice { /* ... */ }
    public function processPayment(Invoice $invoice): bool { /* ... */ }
    public function exportUsersToCsv(): string { /* ... */ }
    public function importUsersFromCsv(string $path): int { /* ... */ }
    public function calculateTax(User $user): float { /* ... */ }
    public function generateReport(): array { /* ... */ }
    public function backupDatabase(): void { /* ... */ }
    public function cleanOldSessions(): void { /* ... */ }
    public function sendPushNotification(User $user, string $msg): void { /* ... */ }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserService {
    public function __construct(
        private UserRepository $users,
        private WelcomeEmailSender $emailSender,
    ) {}

    public function create(array $data): User {
        $user = $this->users->create($data);
        $this->emailSender->send($user);
        return $user;
    }

    public function delete(int $id): void {
        $this->users->delete($id);
    }
}

class BillingService {
    public function __construct(
        private InvoiceGenerator $invoice,
        private PaymentProcessor $payment,
        private TaxCalculator $tax,
    ) {}

    public function bill(User $user): PaymentResult { /* ... */ }
}

class DataExportService {
    public function exportUsers(string $format): string { /* ... */ }
    public function importUsers(string $path): int { /* ... */ }
}
```

## See Also

- [oop-single-responsibility](./oop-single-responsibility.md)
- [proj-service-layer](./proj-service-layer.md)
