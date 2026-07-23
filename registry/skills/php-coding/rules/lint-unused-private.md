# lint-unused-private

> Detect unused private methods/properties

## Why It Matters

Unused private members are dead code — they add maintenance burden, confuse readers, and suggest incomplete refactoring. PHPStan/Psalm detect them at level 8+. Remove them or make them public/protected if they're part of the API.

## Bad

```php
<?php

declare(strict_types=1);

class ReportService {
    private function generateCharts(): array {
        // Complex chart logic — never called
    }

    private function exportToCsv(array $data): string {
        // CSV export — wrote but not wired up
    }

    private int $maxRows = 1000; // Never used
}
```

## Good

```php
<?php

declare(strict_types=1);

class ReportService {
    public function generate(ReportRequest $request): Report {
        $data = $this->fetchData($request);
        return new Report(data: $data, charts: $this->generateCharts($data));
    }

    private function generateCharts(array $data): array {
        return Chart::fromData($data);
    }

    private function fetchData(ReportRequest $request): array {
        return ReportDataQuery::new($request)->get();
    }
    // Removed unused maxRows and exportToCsv
}

// PHPStan detects unused private members at level 8+
// phpstan analyse --level 8 src/
// Reports: "Method ReportService::exportToCsv() is unused"
// Reports: "Property ReportService::$maxRows is never written, only read"
```

## See Also

- [lint-no-unused-imports](./lint-no-unused-imports.md)
- [doc-no-stale-code](./doc-no-stale-code.md)
