# doc-readme-standard

> Standard README with install, usage, API, license

## Why It Matters

A well-structured README enables developers to understand, install, and use your project quickly. Include: project name/description, installation, quick start, API/usage examples, configuration, testing, and license.

## Bad

```php
<?php

declare(strict_types=1);

// README.md
// # My Project
// A PHP library for doing things.
// composer require my/project
```

## Good

```php
<?php

declare(strict_types=1);

// README.md — standard structure
// # Project Name
// Brief description of what this project does.
//
// ## Installation
// composer require vendor/project
//
// ## Quick Start
// ```php
// use Vendor\Project\Client;
// $client = new Client('api-key');
// $result = $client->doSomething();
// ```
//
// ## Usage
// ### Configuration
// ### API Reference
// ### Examples
//
// ## Testing
// composer test
//
// ## Requirements
// - PHP >= 8.3
// - ext-json
//
// ## License
// MIT License — see LICENSE.md
```

## See Also

- [doc-changelog-keep](./doc-changelog-keep.md)
- [proj-composer-autoload](./proj-composer-autoload.md)
