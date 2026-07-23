# test-database-testing

> Use `RefreshDatabase` trait (Laravel) or transactions

## Why It Matters

Tests that hit the database must leave it clean for the next test. `RefreshDatabase` migrates and rolls back per test. Alternatively, wrap tests in database transactions that rollback after each test. Never let test data accumulate.

## Bad

```php
<?php

declare(strict_types=1);

class UserTest extends TestCase {
    public function testCreate(): void {
        User::create(['name' => 'John', 'email' => 'john@test.com']);
        $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
        // Data persists — pollutes next test
    }

    public function testDelete(): void {
        $count = User::count(); // Includes data from previous test!
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase {
    use RefreshDatabase;

    public function testCreate_ValidData_CreatesUser(): void {
        $user = User::create(['name' => 'John', 'email' => 'john@test.com']);
        $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
        // Database rolled back after test
    }

    public function testDelete_ExistingUser_RemovesUser(): void {
        $user = User::create(['name' => 'Jane', 'email' => 'jane@test.com']);
        $user->delete();
        $this->assertDatabaseMissing('users', ['email' => 'jane@test.com']);
        // Clean state — no pollution from previous tests
    }
}
```

## See Also

- [test-isolation](./test-isolation.md)
- [test-factories-over-fixtures](./test-factories-over-fixtures.md)
