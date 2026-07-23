# oop-dependency-injection

> Inject dependencies; don't instantiate inline

## Why It Matters

Instantiating dependencies inside a class creates tight coupling — the class can't be tested with mocks or changed without modifying the class itself. Inject dependencies through the constructor so they can be swapped, mocked, and controlled externally.

## Bad

```php
<?php

declare(strict_types=1);

class NewsletterService {
    public function send(string $subject, string $body): void {
        $mailer = new SmtpMailer('smtp.example.com', 587);
        $logger = new FileLogger('/var/log/newsletter.log');
        foreach ($this->getSubscribers() as $subscriber) {
            $mailer->send($subscriber->email, $subject, $body);
        }
        $logger->info("Sent to {$count} subscribers");
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class NewsletterService {
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private SubscriberRepository $repository,
    ) {}

    public function send(string $subject, string $body): void {
        $count = 0;
        foreach ($this->repository->getActiveSubscribers() as $subscriber) {
            $this->mailer->send($subscriber->email, $subject, $body);
            $count++;
        }
        $this->logger->info("Sent to {$count} subscribers");
    }
}
```

## See Also

- [oop-constructor-injection-over-setter](./oop-constructor-injection-over-setter.md)
- [di-container-binding](./di-container-binding.md)
