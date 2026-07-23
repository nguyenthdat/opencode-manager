# err-throw-exceptions

> Throw exceptions, never return error codes or `false`

## Why It Matters

Returning `false` or error codes requires callers to check return values, which is easily forgotten. Exceptions force the issue — unhandled exceptions halt execution with a clear stack trace. They separate error handling from normal control flow and carry context.

## Bad

```php
<?php

declare(strict_types=1);

class FileReader {
    public function read(string $path): string|false {
        $content = file_get_contents($path);
        if ($content === false) return false;
        return $content;
    }
}

$data = $reader->read('/tmp/data.txt');
processData($data); // Could be false!
```

## Good

```php
<?php

declare(strict_types=1);

class FileReader {
    /** @throws FileReadException */
    public function read(string $path): string {
        $content = file_get_contents($path);
        if ($content === false) {
            throw new FileReadException("Could not read file: {$path}");
        }
        return $content;
    }
}

try {
    $data = $reader->read('/tmp/data.txt');
    processData($data);
} catch (FileReadException $e) {
    logger()->error('Failed to read file', ['path' => '/tmp/data.txt', 'error' => $e->getMessage()]);
}
```

## See Also

- [err-custom-exceptions](./err-custom-exceptions.md)
- [err-catch-specific](./err-catch-specific.md)
