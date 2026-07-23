# anti-die-in-library

> Don't use `die()`/`exit()` in library code

## Why It Matters

`die()` and `exit()` terminate the entire process, making the library unusable in CLI tools, test suites, or long-running processes. Throw exceptions instead — callers decide how to handle the error. Only the application entry point should exit.

## Bad

```php
<?php

declare(strict_types=1);

class ConfigLoader {
    public function load(string $path): array {
        if (!file_exists($path)) {
            die("Config file not found: {$path}"); // Kills entire process
        }
        $data = parse_ini_file($path);
        if ($data === false) {
            exit(1); // Fatal — can't recover
        }
        return $data;
    }
}

// In a test
$loader = new ConfigLoader();
$config = $loader->load('missing.ini'); // Kills test runner!
```

## Good

```php
<?php

declare(strict_types=1);

class ConfigLoader {
    /** @throws ConfigNotFoundException */
    public function load(string $path): array {
        if (!file_exists($path)) {
            throw new ConfigNotFoundException("Config file not found: {$path}");
        }
        $data = parse_ini_file($path);
        if ($data === false) {
            throw new ConfigParseException("Failed to parse config: {$path}");
        }
        return $data;
    }
}

// Application entry point decides to exit
try {
    $config = $loader->load($path);
} catch (ConfigNotFoundException $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}

// Test — can catch and assert
try {
    $loader->load('missing.ini');
    $this->fail('Expected exception');
} catch (ConfigNotFoundException $e) {
    $this->assertStringContainsString('missing.ini', $e->getMessage());
}
```

## See Also

- [err-throw-exceptions](./err-throw-exceptions.md)
- [err-custom-exceptions](./err-custom-exceptions.md)
