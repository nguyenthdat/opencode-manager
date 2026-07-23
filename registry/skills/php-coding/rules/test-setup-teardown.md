# test-setup-teardown

> Use `setUp()`/`tearDown()` for test fixtures

## Why It Matters

`setUp()` runs before each test, providing a clean starting state. `tearDown()` runs after each test for cleanup. Use these for shared fixtures to reduce code duplication while maintaining test isolation.

## Bad

```php
<?php

declare(strict_types=1);

class UserServiceTest extends TestCase {
    public function testUpdateProfile(): void {
        $user = User::create(['name' => 'John', 'email' => 'john@example.com']);
        $service = new UserService(new InMemoryUserRepository());
        // Duplicated setup in every test
    }

    public function testDeleteAccount(): void {
        $user = User::create(['name' => 'John', 'email' => 'john@example.com']);
        $service = new UserService(new InMemoryUserRepository());
        // Same setup again
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class UserServiceTest extends TestCase {
    private User $user;
    private UserService $service;

    protected function setUp(): void {
        parent::setUp();
        $this->user = User::create(['name' => 'John', 'email' => 'john@example.com']);
        $this->service = new UserService(new InMemoryUserRepository());
    }

    protected function tearDown(): void {
        // Clean up if needed
        parent::tearDown();
    }

    public function testUpdateProfile_ValidData_UpdatesUser(): void {
        $this->service->updateProfile($this->user, ['name' => 'Jane']);
        $this->assertSame('Jane', $this->user->name);
    }

    public function testDeleteAccount_ActiveUser_SoftDeletes(): void {
        $this->service->deleteAccount($this->user);
        $this->assertNotNull($this->user->deletedAt);
    }
}
```

## See Also

- [test-isolation](./test-isolation.md)
- [test-database-testing](./test-database-testing.md)
