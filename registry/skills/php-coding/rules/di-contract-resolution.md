# di-contract-resolution

> Type-hint interfaces, let container resolve concretes

## Why It Matters

Always type-hint against interfaces (abstractions), not concrete classes. This allows the container to resolve the bound implementation and enables easy swapping for tests or different environments. It's the 'D' in SOLID.

## Bad

```php
<?php

declare(strict_types=1);

class NewsletterController {
    public function __construct(
        private MailchimpApiClient $emailService,
        private MysqlSubscriberRepository $repository,
    ) {}

    public function send(): void {
        $subscribers = $this->repository->all();
        $this->emailService->sendCampaign($subscribers);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class NewsletterController {
    public function __construct(
        private EmailServiceInterface $emailService,
        private SubscriberRepositoryInterface $repository,
    ) {}

    public function send(): void {
        $subscribers = $this->repository->all();
        $this->emailService->sendCampaign($subscribers);
    }
}

// Bind in service provider
$this->app->bind(EmailServiceInterface::class, MailchimpApiClient::class);
$this->app->bind(SubscriberRepositoryInterface::class, MysqlSubscriberRepository::class);

// For tests — bind different implementations
$this->app->bind(EmailServiceInterface::class, FakeEmailService::class);
$this->app->bind(SubscriberRepositoryInterface::class, InMemorySubscriberRepository::class);
```

## See Also

- [di-container-binding](./di-container-binding.md)
- [di-testability-first](./di-testability-first.md)
