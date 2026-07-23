# db-migrations-version

> Use migrations for schema, never manual ALTER

## Why It Matters

Migrations version-control your database schema alongside application code. Manual ALTER TABLE commands drift between environments and have no rollback capability. Every schema change should be in a migration file.

## Bad

```php
<?php

declare(strict_types=1);

// Manual SQL — drifts between dev/staging/production
// $ mysql -u root -p app
// ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email;
// ALTER TABLE users ADD COLUMN avatar VARCHAR(255);
// ALTER TABLE orders ADD INDEX idx_status (status);
// No record of who did what or when. Can't rollback.
```

## Good

```php
<?php

declare(strict_types=1);

// Laravel migration — versioned, reversible
class AddContactFieldsToUsersTable extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable();
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'avatar']);
        });
    }
}

// Run: php artisan migrate
// Rollback: php artisan migrate:rollback
// Status: php artisan migrate:status
```

## See Also

- [db-migration-reversible](./db-migration-reversible.md)
- [proj-version-tags](./proj-version-tags.md)
