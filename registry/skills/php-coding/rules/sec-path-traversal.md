# sec-path-traversal

> Use `basename()` and `realpath()` for file path validation

## Why It Matters

Path traversal attacks use `../` sequences to access files outside the intended directory. Always validate user-supplied file paths with `basename()` to strip directory components and `realpath()` to resolve and verify the final path.

## Bad

```php
<?php

declare(strict_types=1);

$filename = $_GET['file'];
$content = file_get_contents('/var/www/uploads/' . $filename);
// Attack: ?file=../../.env

$template = $_GET['template'];
include '/var/www/templates/' . $template . '.php';
// Attack: ?template=../../../malicious
```

## Good

```php
<?php

declare(strict_types=1);

$baseDir = realpath('/var/www/uploads');

if ($baseDir === false) {
    throw new \RuntimeException('Upload directory does not exist');
}

$filename = basename($_GET['file']); // Strips directory components
$path = $baseDir . '/' . $filename;

$realPath = realpath($path);
if ($realPath === false || !str_starts_with($realPath, $baseDir)) {
    throw new SecurityException('Invalid file path');
}

$content = file_get_contents($realPath);
```

## See Also

- [sec-file-upload](./sec-file-upload.md)
- [sec-input-sanitize](./sec-input-sanitize.md)
