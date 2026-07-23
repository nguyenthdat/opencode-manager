# oop-repository-pattern

> Abstract data access with repository pattern

## Why It Matters

The repository pattern mediates between the domain and data mapping layers, acting like an in-memory collection. It decouples business logic from persistence details, making code testable and allowing storage changes without changing domain code.

## Bad

```php
<?php

declare(strict_types=1);

class UserService {
    public function getActiveUsers(): array {
        return User::where('status', 'active')
            ->where('last_login', '>', now()->subDays(30))->get()->toArray();
    }

    public function updateProfile(int $userId, array $data): void {
        \DB::table('users')->where('id', $userId)->update($data);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

interface UserRepository {
    /** @return User[] */
    public function findActiveSince(\DateTimeImmutable $date): array;
    public function findById(int $id): ?User;
    public function save(User $user): void;
}

class EloquentUserRepository implements UserRepository {
    public function findActiveSince(\DateTimeImmutable $date): array {
        return User::query()->where('status', 'active')
            ->where('last_login', '>', $date)
            ->get()->map(fn($m) => $m->toDomain())->all();
    }

    public function findById(int $id): ?User {
        $model = User::find($id);
        return $model?->toDomain();
    }

    public function save(User $user): void {
        User::updateOrCreate(['id' => $user->id], $user->toArray());
    }
}
```

## See Also

- [oop-dependency-injection](./oop-dependency-injection.md)
- [di-contract-resolution](./di-contract-resolution.md)
