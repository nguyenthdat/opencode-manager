# anti-raw-sql

> Don't concatenate user input into SQL strings

## Why It Matters

String interpolation in SQL is the #1 cause of SQL injection vulnerabilities. Never put variables directly into SQL strings. Use prepared statements or query builders — without exception, for every query, every time.

## Bad

```php
<?php

declare(strict_types=1);

$id = $_GET['id'];
$user = $db->query("SELECT * FROM users WHERE id = {$id}");

$name = $_POST['name'];
$db->exec("INSERT INTO users (name) VALUES ('{$name}')");

$column = $_GET['sort'];
$direction = $_GET['dir'];
$rows = $db->query("SELECT * FROM products ORDER BY {$column} {$direction}");
```

## Good

```php
<?php

declare(strict_types=1);

// Parameterized queries — always
$stmt = $db->prepare('SELECT * FROM users WHERE id = :id');
$stmt->execute(['id' => (int) $_GET['id']]);
$user = $stmt->fetch();

$stmt = $db->prepare('INSERT INTO users (name) VALUES (:name)');
$stmt->execute(['name' => $_POST['name']]);

// For dynamic ORDER BY — whitelist
$allowedColumns = ['name', 'price', 'created_at'];
$column = in_array($_GET['sort'], $allowedColumns, true) ? $_GET['sort'] : 'name';
$direction = strtoupper($_GET['dir']) === 'DESC' ? 'DESC' : 'ASC';
$stmt = $db->query("SELECT * FROM products ORDER BY {$column} {$direction}");
```

## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [sec-prepared-statements](./sec-prepared-statements.md)
