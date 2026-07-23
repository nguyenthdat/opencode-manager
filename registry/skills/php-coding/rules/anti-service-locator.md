# anti-service-locator

> Don't use service locator anti-pattern (resolving from container)

## Why It Matters

Calling `app()` or `$container->get()` inside business logic hides dependencies, makes classes untestable without a framework, and obscures the class's actual dependencies. All dependencies should be visible in the constructor signature.

## Bad

```php
<?php

declare(strict_types=1);

class InvoiceService {
    public function generate(int $orderId): Invoice {
        $order = Order::find($orderId);

        // Hidden dependencies — can't see what this class needs
        $pdf = app(PdfGenerator::class)->generate($order);
        $client = app(\GuzzleHttp\Client::class);
        $response = $client->post('https://tax-api.example.com', ['json' => $order->toArray()]);

        app('log')->info('Invoice generated');
        return new Invoice($pdf, $order);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class InvoiceService {
    public function __construct(
        private PdfGeneratorInterface $pdfGenerator,
        private \GuzzleHttp\ClientInterface $httpClient,
        private LoggerInterface $logger,
    ) {}

    public function generate(int $orderId): Invoice {
        $order = Order::find($orderId);

        $pdf = $this->pdfGenerator->generate($order);
        $this->httpClient->post('https://tax-api.example.com', ['json' => $order->toArray()]);
        $this->logger->info('Invoice generated', ['order_id' => $orderId]);

        return new Invoice($pdf, $order);
    }
}

// Constructor clearly shows all dependencies
// Testable without a container
new InvoiceService($mockPdf, $mockHttp, $mockLogger);
```

## See Also

- [di-no-service-locator](./di-no-service-locator.md)
- [di-auto-wiring](./di-auto-wiring.md)
