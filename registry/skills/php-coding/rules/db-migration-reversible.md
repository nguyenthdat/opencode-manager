# db-migration-reversible

> Write reversible migrations with `up()`/`down()`

## Why It Matters

Reversible migrations enable safe rollbacks. Every `up()` should have a corresponding `down()` that undoes the change. For destructive changes (dropping columns), consider a multi-deploy strategy to avoid data loss.

## Bad

```php
<?php

declare(strict_types=1);

class AddFullNameToUsers extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name');
        });
    }

    // No down() — can't rollback. If migration fails, stuck.
}
```

## Good

```php
<?php

declare(strict_types=1);

class AddFullNameToUsers extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('email');
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('full_name');
        });
    }
}

// For destructive changes — multi-deploy strategy
// Deploy 1: Add new column, stop writing to old column
// Deploy 2: Migrate data from old to new
// Deploy 3: Drop old column
```

## See Also

- [db-migrations-version](./db-migrations-version.md)
- [err-transaction-rollback](./err-transaction-rollback.md)
