# di-container-binding

> Bind interfaces to implementations in service container

## Why It Matters

Registering interface-to-implementation bindings in the service container enables swapping implementations without changing consuming code. This is the foundation of testability and modularity in modern PHP applications.

## Bad

```php
<?php

declare(strict_types=1);

class OrderController {
    public function create(Request $request): Response {
        $gateway = new StripeGateway(config('services.stripe.key'));
        $mailer = new SmtpMailer(config('mail.host'));
        $processor = new OrderProcessor($gateway, $mailer);
        return $processor->process($request->input());
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class PaymentServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
        $this->app->bind(MailerInterface::class, fn($app) => new SmtpMailer($app['config']['mail.host']));
    }
}

class OrderController {
    public function create(Request $request, PaymentGatewayInterface $gateway, MailerInterface $mailer): Response {
        $processor = new OrderProcessor($gateway, $mailer);
        return $processor->process($request->input());
    }
}
```

## See Also

- [di-auto-wiring](./di-auto-wiring.md)
- [di-contract-resolution](./di-contract-resolution.md)
