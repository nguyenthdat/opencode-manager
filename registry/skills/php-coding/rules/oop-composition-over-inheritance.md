# oop-composition-over-inheritance

> Prefer composition/traits over deep inheritance

## Why It Matters

Deep inheritance hierarchies become rigid and hard to change. Composition (injecting collaborators) and traits (horizontal code reuse) provide more flexibility. Inheritance should be reserved for clear 'is-a' relationships, not just code reuse.

## Bad

```php
<?php

declare(strict_types=1);

abstract class Model { /* ... */ }
abstract class Authenticatable extends Model { /* ... */ }
abstract class SoftDeletable extends Authenticatable { /* ... */ }
class User extends SoftDeletable { /* ... */ }

class Admin extends User {
    public function deleteUser(User $user): void {
        if ($user->trashed()) { /* ... */ }
        if (!$user->can('be_deleted')) { /* ... */ }
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

trait HasTimestamps {
    public \DateTimeImmutable $createdAt;
    public ?\DateTimeImmutable $updatedAt = null;
}

trait SoftDeletes {
    public ?\DateTimeImmutable $deletedAt = null;
    public function isDeleted(): bool { return $this->deletedAt !== null; }
}

class UserDeletionService {
    public function __construct(
        private PermissionChecker $permissions,
        private AuditLogger $logger,
    ) {}

    public function delete(User $user): void {
        if (!$this->permissions->canDelete($user)) throw new AccessDeniedException();
        $user->deletedAt = new \DateTimeImmutable();
        $user->save();
        $this->logger->log('user_deleted', ['id' => $user->id]);
    }
}
```

## See Also

- [oop-interface-segregation](./oop-interface-segregation.md)
- [oop-trait-over-abstract](./oop-trait-over-abstract.md)
