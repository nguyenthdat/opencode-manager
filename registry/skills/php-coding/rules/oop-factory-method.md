# oop-factory-method

> Use static factory methods over complex constructors (named constructors)

## Why It Matters

Named constructors (static factory methods) provide descriptive names for different ways to create an object. They can return cached instances, subclasses, or perform validation before construction. They're more expressive than overloaded constructors.

## Bad

```php
<?php

declare(strict_types=1);

class DateRange {
    public function __construct(
        \DateTimeImmutable $start, \DateTimeImmutable $end, ?string $timezone = null,
    ) {
        if ($start > $end) throw new \InvalidArgumentException();
        $this->start = $timezone ? $start->setTimezone(new \DateTimeZone($timezone)) : $start;
        $this->end = $timezone ? $end->setTimezone(new \DateTimeZone($timezone)) : $end;
    }
}

$range = new DateRange(new \DateTimeImmutable('2024-01-01'), new \DateTimeImmutable('2024-12-31'));
```

## Good

```php
<?php

declare(strict_types=1);

class DateRange {
    private function __construct(
        public readonly \DateTimeImmutable $start,
        public readonly \DateTimeImmutable $end,
    ) {
        if ($start > $end) throw new \InvalidArgumentException();
    }

    public static function fromStrings(string $start, string $end): self {
        return new self(new \DateTimeImmutable($start), new \DateTimeImmutable($end));
    }

    public static function currentMonth(): self {
        $now = new \DateTimeImmutable();
        return new self(
            $now->modify('first day of this month'),
            $now->modify('last day of this month'),
        );
    }

    public static function trailingDays(int $days): self {
        $end = new \DateTimeImmutable();
        return new self($end->modify("-{$days} days"), $end);
    }

    public function contains(\DateTimeImmutable $date): bool {
        return $date >= $this->start && $date <= $this->end;
    }
}
```

## See Also

- [oop-builder-pattern](./oop-builder-pattern.md)
- [type-named-arguments](./type-named-arguments.md)
