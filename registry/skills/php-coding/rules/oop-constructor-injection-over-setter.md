# oop-constructor-injection-over-setter

> Use constructor injection over setter injection

## Why It Matters

Constructor injection guarantees dependencies are available at construction time, making the object always valid. Setter injection leaves objects in an incomplete state between construction and the setter call.

## Bad

```php
<?php

declare(strict_types=1);

class ReportGenerator {
    private ?DatabaseConnection $db = null;
    private ?TemplateEngine $template = null;

    public function setDb(DatabaseConnection $db): void { $this->db = $db; }
    public function setTemplate(TemplateEngine $template): void { $this->template = $template; }

    public function generate(int $reportId): string {
        return $this->template->render(
            $this->db->query("SELECT * FROM reports WHERE id = ?", [$reportId])
        );
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ReportGenerator {
    public function __construct(
        private DatabaseConnection $db,
        private TemplateEngine $template,
        private ?CacheInterface $cache = null, // Optional dependency
    ) {}

    public function generate(int $reportId): string {
        return $this->template->render(
            $this->db->query('SELECT * FROM reports WHERE id = ?', [$reportId])
        );
    }
}
```

## See Also

- [oop-dependency-injection](./oop-dependency-injection.md)
- [di-auto-wiring](./di-auto-wiring.md)
