# sec-password-hash

> Use `password_hash()`/`password_verify()`, never md5/sha1

## Why It Matters

md5 and sha1 are cryptographically broken and too fast — they're vulnerable to rainbow tables and brute-force attacks. Use `password_hash()` (bcrypt/argon2) which includes automatic salting, key stretching, and algorithm upgrades.

## Bad

```php
<?php

declare(strict_types=1);

// md5 — broken
$hash = md5($password);
$db->insert('users', ['password' => $hash]);

// sha1 — broken
$hash = sha1($password);
if ($hash === $storedHash) { /* login */ }

// Manual salting — error-prone
$salt = 'myhardcodedsalt';
$hash = md5($salt . $password);
```

## Good

```php
<?php

declare(strict_types=1);

// password_hash — uses bcrypt by default, auto-salted
$hash = password_hash($password, PASSWORD_DEFAULT);
$db->insert('users', ['password' => $hash]);

// password_verify — timing-attack safe
if (password_verify($password, $user->password_hash)) {
    // Login successful
}

// Check if rehash needed (algorithm or cost changed)
if (password_needs_rehash($user->password_hash, PASSWORD_DEFAULT)) {
    $newHash = password_hash($password, PASSWORD_DEFAULT);
    $user->update(['password' => $newHash]);
}

// Argon2 for extra security
$hash = password_hash($password, PASSWORD_ARGON2ID);
```

## See Also

- [sec-env-secrets](./sec-env-secrets.md)
- [sec-input-sanitize](./sec-input-sanitize.md)
