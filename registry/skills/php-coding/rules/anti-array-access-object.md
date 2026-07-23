# anti-array-access-object

> Don't use ArrayAccess when proper methods exist

## Why It Matters

Implementing ArrayAccess (`$obj['key']`) on non-collection objects blurs the line between arrays and objects. Use named methods that describe intent. ArrayAccess is appropriate only for collection-like objects.

## Bad

```php
<?php

declare(strict_types=1);

class User implements \ArrayAccess {
    private array $data = [];

    public function offsetGet(mixed $offset): mixed { return $this->data[$offset] ?? null; }
    public function offsetSet(mixed $offset, mixed $value): void { $this->data[$offset] = $value; }
    public function offsetExists(mixed $offset): bool { return isset($this->data[$offset]); }
    public function offsetUnset(mixed $offset): void { unset($this->data[$offset]); }
}

$user = new User();
$user['name'] = 'John';    // What does this mean?
$user['email'] = 'test@t'; // No validation
echo $user['naem'];        // Typo returns null
```

## Good

```php
<?php

declare(strict_types=1);

class User {
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}

    public function withName(string $name): self {
        return new self($name, $this->email);
    }
}

$user = new User('John', 'john@test.com');
echo $user->name; // Type-safe, autocompleted"

// ArrayAccess is fine for collection-like objects
class Settings implements \ArrayAccess, \IteratorAggregate {
    public function __construct(private array $settings) {}

    public function get(string $key, mixed $default = null): mixed {
        return $this->settings[$key] ?? $default;
    }

    public function offsetGet(mixed $offset): mixed { return $this->get($offset); }
    // ... other ArrayAccess methods
}
```

## See Also

- [anti-magic-methods-overuse](./anti-magic-methods-overuse.md)
- [oop-encapsulation](./oop-encapsulation.md)
