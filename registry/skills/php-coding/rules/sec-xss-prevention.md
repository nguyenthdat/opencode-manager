# sec-xss-prevention

> Always escape output: `htmlspecialchars()` or `{{ }}` in Blade/Twig

## Why It Matters

Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into pages viewed by other users. Always escape output — use `htmlspecialchars()` in plain PHP or rely on template engine auto-escaping (`{{ }}` in Blade, `{{ }}` in Twig).

## Bad

```php
<?php

declare(strict_types=1);

// Raw PHP — unescaped output
echo "<div>" . $_GET['name'] . "</div>";
echo "<a href='" . $user->website . "'>Profile</a>";

// Blade with raw output — dangerous
{!! $user->bio !!}
```

## Good

```php
<?php

declare(strict_types=1);

// Raw PHP — escaped
echo '<div>' . htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8') . '</div>';
echo '<a href="' . htmlspecialchars($user->website, ENT_QUOTES, 'UTF-8') . '">Profile</a>';

// Blade — auto-escaped
{{ $user->bio }}

// Only use {!! !!} when content is trusted HTML you've sanitized yourself
{!! Purifier::clean($user->trustedHtml) !!}
```

## See Also

- [sec-input-sanitize](./sec-input-sanitize.md)
- [sec-csrf-token](./sec-csrf-token.md)
