# test-phpunit-pest

> Use PHPUnit (procedural) or Pest (BDD style)

## Why It Matters

PHPUnit is the de facto standard for PHP testing with wide ecosystem support. Pest provides a more expressive, BDD-style syntax built on top of PHPUnit. Choose one per project — don't mix.

## Bad

```php
<?php

declare(strict_types=1);

// Custom testing — no framework
function testUserCreation() {
    $user = User::create(['name' => 'John']);
    assert($user->name === 'John');
    assert($user->id > 0);
}
testUserCreation();
```

## Good

```php
<?php

declare(strict_types=1);

// PHPUnit
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase {
    public function testCreate_ValidData_ReturnsUser(): void {
        $user = User::create(['name' => 'John']);
        $this->assertSame('John', $user->name);
        $this->assertGreaterThan(0, $user->id);
    }
}

// Pest (BDD style)
test('creates user with valid data', function () {
    $user = User::create(['name' => 'John']);
    expect($user->name)->toBe('John');
    expect($user->id)->toBeGreaterThan(0);
});

// Pest with describe/it
describe('User creation', function () {
    it('saves the user name', function () {
        $user = User::create(['name' => 'John']);
        expect($user->name)->toBe('John');
    });
});
```

## See Also

- [test-arrange-act-assert](./test-arrange-act-assert.md)
- [name-test-method](./name-test-method.md)
