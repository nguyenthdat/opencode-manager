# oop-interface-segregation

> Keep interfaces small and focused

## Why It Matters

Large interfaces force implementations to define methods they don't need. The Interface Segregation Principle states: no client should depend on methods it doesn't use. Break large interfaces into smaller, role-specific ones.

## Bad

```php
<?php

declare(strict_types=1);

interface StorageInterface {
    public function put(string $key, string $value): void;
    public function get(string $key): ?string;
    public function delete(string $key): void;
    public function list(string $prefix): array;
    public function copy(string $from, string $to): void;
    public function move(string $from, string $to): void;
    public function getUrl(string $key): string;
    public function getMetadata(string $key): array;
}

class ReadOnlyCache implements StorageInterface {
    public function put(string $key, string $value): void {
        throw new \BadMethodCallException('Read-only cache');
    }
    // ... 7 more useless methods
}
```

## Good

```php
<?php

declare(strict_types=1);

interface Reader {
    public function get(string $key): ?string;
    public function has(string $key): bool;
}

interface Writer {
    public function put(string $key, string $value): void;
    public function delete(string $key): void;
}

interface Lister {
    public function list(string $prefix): array;
}

interface ReadWriteStorage extends Reader, Writer {}

class ReadOnlyCache implements Reader {
    public function get(string $key): ?string { return $this->cache[$key] ?? null; }
    public function has(string $key): bool { return isset($this->cache[$key]); }
}
```

## See Also

- [oop-single-responsibility](./oop-single-responsibility.md)
- [oop-dependency-injection](./oop-dependency-injection.md)
