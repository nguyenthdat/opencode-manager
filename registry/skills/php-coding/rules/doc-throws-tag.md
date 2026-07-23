# doc-throws-tag

> Document `@throws` for methods that throw

## Why It Matters

`@throws` tags warn callers about exceptions they might need to handle. Static analyzers use them to detect uncaught exceptions. Document all exceptions your method can throw — including those from internal calls.

## Bad

```php
<?php

declare(strict_types=1);

class FileService {
    public function read(string $path): string {
        $content = file_get_contents($path); // Can throw — not documented
        return $content;
    }

    public function parseJson(string $json): array {
        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        return $data;
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class FileService {
    /**
     * Reads and returns the contents of a file.
     *
     * @param string $path Absolute path to the file
     * @return string The file contents
     * @throws FileNotFoundException When the file does not exist
     * @throws FileNotReadableException When the file is not readable
     */
    public function read(string $path): string {
        if (!file_exists($path)) {
            throw new FileNotFoundException($path);
        }
        if (!is_readable($path)) {
            throw new FileNotReadableException($path);
        }
        return file_get_contents($path);
    }

    /**
     * Parses a JSON string into an associative array.
     *
     * @param string $json The JSON string to parse
     * @return array<string, mixed> The decoded data
     * @throws \JsonException When the JSON is invalid
     */
    public function parseJson(string $json): array {
        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }
}
```

## See Also

- [doc-phpdoc-public](./doc-phpdoc-public.md)
- [doc-param-return](./doc-param-return.md)
