# sec-sql-injection

> Use parameterized queries/ORM; never raw SQL with user input

## Why It Matters

SQL injection is the most common and dangerous web vulnerability. Never concatenate user input into SQL strings — use parameterized queries (PDO prepared statements) or an ORM that handles escaping. This is non-negotiable in production code.

## Bad

```php
<?php

declare(strict_types=1);

$id = $_GET['id'];
$result = $db->query("SELECT * FROM users WHERE id = {$id}");

$orderBy = $_GET['sort'];
$result = $db->query("SELECT * FROM products ORDER BY {$orderBy}");

$ids = implode(',', $_POST['ids']);
$db->exec("DELETE FROM users WHERE id IN ({$ids})");
```

## Good

```php
<?php

declare(strict_types=1);

$id = (int) $_GET['id'];
$result = $db->query('SELECT * FROM users WHERE id = ?', [$id]);

$allowedSorts = ['name', 'price', 'created_at'];
$orderBy = in_array($_GET['sort'], $allowedSorts, true) ? $_GET['sort'] : 'name';
$result = $db->query("SELECT * FROM products ORDER BY {$orderBy}");

$ids = array_map('intval', $_POST['ids']);
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $db->prepare("DELETE FROM users WHERE id IN ({$placeholders})");
$stmt->execute($ids);
```

## See Also

- [sec-prepared-statements](./sec-prepared-statements.md)
- [db-query-builder-over-raw](./db-query-builder-over-raw.md)
