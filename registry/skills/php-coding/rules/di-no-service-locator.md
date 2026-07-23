# di-no-service-locator

> Inject dependencies; don't resolve from container in business logic

## Why It Matters

Calling `$container->get()` or `app()` from within business logic is the Service Locator anti-pattern. It hides dependencies, makes testing harder, and couples code to the container. Always inject dependencies explicitly via the constructor.

## Bad

```php
<?php

declare(strict_types=1);

class OrderService {
    public function process(int $orderId): void {
        $mailer = app(MailerInterface::class);
        $logger = resolve(LoggerInterface::class);
        $queue = app('queue');
        $order = Order::find($orderId);
        $mailer->sendConfirmation($order);
        $queue->push(new ProcessOrderJob($order));
        $logger->info('Order processed');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderService {
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private QueueInterface $queue,
    ) {}

    public function process(int $orderId): void {
        $order = Order::find($orderId);
        $this->mailer->sendConfirmation($order);
        $this->queue->push(new ProcessOrderJob($order));
        $this->logger->info('Order processed');
    }
}
```

## See Also

- [di-auto-wiring](./di-auto-wiring.md)
- [di-testability-first](./di-testability-first.md)
