# sec-prepared-statements

> Use PDO prepared statements; never concatenate queries

## Why It Matters

Prepared statements separate SQL structure from data, making SQL injection impossible. The database treats parameter values as data, never as SQL. This is the only safe way to include user input in SQL queries.

## Bad

```php
<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=localhost;dbname=app', 'user', 'pass');

$name = $_GET['name'];
$stmt = $pdo->query("SELECT * FROM users WHERE name = '{$name}'");

$id = $_POST['id'];
$pdo->exec("DELETE FROM users WHERE id = {$id}");

mysql_query("SELECT * FROM users WHERE id = " . $_GET['id']);
```

## Good

```php
<?php

declare(strict_types=1);

$pdo = new PDO('mysql:host=localhost;dbname=app', 'user', 'pass', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false, // Real prepared statements
]);

$stmt = $pdo->prepare('SELECT * FROM users WHERE name = :name');
$stmt->execute(['name' => $_GET['name']]);
$results = $stmt->fetchAll();

$stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
$stmt->execute(['id' => (int) $_POST['id']]);

// Multiple inserts
$stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (:name, :email)');
foreach ($users as $user) {
    $stmt->execute(['name' => $user['name'], 'email' => $user['email']]);
}
```

## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [db-query-builder-over-raw](./db-query-builder-over-raw.md)
