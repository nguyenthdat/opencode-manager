# di-testability-first

> Design classes for testability via DI first

## Why It Matters

Classes designed with dependency injection are inherently testable — you can pass mock dependencies in tests. A class that's hard to construct in a test is a design smell that indicates tight coupling. Design for testability from the start.

## Bad

```php
<?php

declare(strict_types=1);

class ImportService {
    public function import(string $filename): int {
        $client = new \GuzzleHttp\Client();
        $response = $client->get("https://api.example.com/data/{$filename}");
        $data = json_decode($response->getBody(), true);
        $db = new \PDO(env('DB_DSN'), env('DB_USER'), env('DB_PASS'));
        $count = 0;
        foreach ($data as $row) {
            $stmt = $db->prepare('INSERT INTO items (name, price) VALUES (?, ?)');
            $stmt->execute([$row['name'], $row['price']]);
            $count++;
        }
        return $count;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ImportService {
    public function __construct(
        private HttpClientInterface $http,
        private DatabaseConnection $db,
    ) {}

    public function import(string $filename): int {
        $data = $this->http->getJson("https://api.example.com/data/{$filename}");
        $count = 0;
        foreach ($data as $row) {
            $this->db->insert('items', ['name' => $row['name'], 'price' => $row['price']]);
            $count++;
        }
        return $count;
    }
}

// Test — inject mocks easily
$test = new ImportService($mockHttp, $mockDb);
```

## See Also

- [di-contract-resolution](./di-contract-resolution.md)
- [test-mock-over-stub](./test-mock-over-stub.md)
