# perf-prepared-statement-reuse

> Reuse prepared statements in loops

## Why It Matters

Prepare the statement once outside the loop, then execute multiple times with different parameters. Re-preparing in a loop adds unnecessary database round-trips and parsing overhead.

## Bad

```php
<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=localhost;dbname=app', 'user', 'pass');
$users = [['John', 'john@test.com'], ['Jane', 'jane@test.com']];

foreach ($users as $user) {
    $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    $stmt->execute([$user[0], $user[1]]); // Prepare in every iteration
}
```

## Good

```php
<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=localhost;dbname=app', 'user', 'pass');

// Prepare once
$stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (:name, :email)');

foreach ($users as $user) {
    $stmt->execute(['name' => $user[0], 'email' => $user[1]]);
}

// For bulk inserts — single statement
$values = [];
$params = [];
foreach ($users as $i => $user) {
    $values[] = "(:name{$i}, :email{$i})";
    $params["name{$i}"] = $user[0];
    $params["email{$i}"] = $user[1];
}
$sql = 'INSERT INTO users (name, email) VALUES ' . implode(', ', $values);
$pdo->prepare($sql)->execute($params);
```

## See Also

- [db-chunk-processing](./db-chunk-processing.md)
- [perf-generator-yield](./perf-generator-yield.md)
