# err-no-suppress-operator

> Never use `@` error suppression operator

## Why It Matters

The `@` operator hides all errors, including fatal ones, making debugging impossible. It also has a performance cost (it changes the error_reporting level temporarily). Handle errors explicitly with try/catch or proper validation instead.

## Bad

```php
<?php

declare(strict_types=1);

$content = @file_get_contents($path);
$result = @$db->query($sql);
@mkdir('/tmp/cache');
@unlink($tempFile);
```

## Good

```php
<?php

declare(strict_types=1);

if (is_readable($path)) {
    $content = file_get_contents($path);
} else {
    throw new FileReadException($path);
}

try {
    $result = $db->query($sql);
} catch (\PDOException $e) {
    throw new DatabaseException('Query failed', previous: $e);
}

if (!is_dir('/tmp/cache') && !mkdir('/tmp/cache', 0755, true)) {
    throw new \RuntimeException('Failed to create /tmp/cache');
}
```

## See Also

- [err-throw-exceptions](./err-throw-exceptions.md)
- [err-custom-exceptions](./err-custom-exceptions.md)
