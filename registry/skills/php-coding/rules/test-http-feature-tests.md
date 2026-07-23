# test-http-feature-tests

> Test HTTP layer with feature tests, not just unit

## Why It Matters

Unit tests only verify individual classes in isolation. Feature tests verify the full HTTP stack — routing, middleware, validation, and responses — catching integration bugs that unit tests miss. Test both happy and error paths at the HTTP level.

## Bad

```php
<?php

declare(strict_types=1);

class UserControllerTest extends TestCase {
    public function testStore_CreatesUser(): void {
        // Unit test — bypasses routing, middleware, validation
        $controller = new UserController(new UserService());
        $request = Request::create('/users', 'POST', ['name' => 'John', 'email' => 'john@test.com']);
        $response = $controller->store($request);
        $this->assertSame(201, $response->getStatusCode());
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

// Feature test — full HTTP stack
class UserApiTest extends TestCase {
    use RefreshDatabase;

    public function testStore_ValidData_Returns201(): void {
        $response = $this->postJson('/api/users', [
            'name' => 'John',
            'email' => 'john@test.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'name', 'email']]);
    }

    public function testStore_InvalidEmail_Returns422(): void {
        $response = $this->postJson('/api/users', [
            'name' => 'John',
            'email' => 'not-an-email',
            'password' => 'secret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function testStore_Unauthenticated_Returns401(): void {
        $this->withoutMiddleware(); // Tests auth middleware
        $response = $this->postJson('/api/users', ['name' => 'John']);
        $response->assertStatus(401);
    }
}
```

## See Also

- [test-arrange-act-assert](./test-arrange-act-assert.md)
- [test-database-testing](./test-database-testing.md)
