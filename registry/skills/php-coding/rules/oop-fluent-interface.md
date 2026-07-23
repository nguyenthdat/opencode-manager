# oop-fluent-interface

> Return `$this` for method chaining

## Why It Matters

Fluent interfaces (methods returning `$this`) enable method chaining, creating readable, expressive code. Common in builders, query builders, and configuration objects. Each method returns the same instance so calls can be chained.

## Bad

```php
<?php

declare(strict_types=1);

class QueryBuilder {
    private array $select = [];
    private array $where = [];
    private ?int $limit = null;

    public function select(array $columns): void { $this->select = $columns; }
    public function where(string $c, string $op, mixed $v): void { $this->where[] = [$c, $op, $v]; }
    public function limit(int $limit): void { $this->limit = $limit; }
}

$query = new QueryBuilder();
$query->select(['id', 'name']);
$query->where('status', '=', 'active');
$query->limit(10);
```

## Good

```php
<?php

declare(strict_types=1);

class QueryBuilder {
    private array $select = [];
    private array $where = [];
    private ?int $limit = null;

    public function select(array $columns): static { $this->select = $columns; return $this; }
    public function where(string $c, string $op, mixed $v): static { $this->where[] = [$c, $op, $v]; return $this; }
    public function limit(int $limit): static { $this->limit = $limit; return $this; }
    public function get(): array { return $this->execute(); }
}

$results = (new QueryBuilder())
    ->select(['id', 'name'])
    ->where('status', '=', 'active')
    ->where('created_at', '>', '2024-01-01')
    ->limit(10)
    ->get();
```

## See Also

- [oop-builder-pattern](./oop-builder-pattern.md)
- [db-query-builder-over-raw](./db-query-builder-over-raw.md)
