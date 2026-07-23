# rails-migrations-reversible

> Write reversible migrations

## Why It Matters

Rails can auto-reverse most migrations, but raw SQL and data transformations can't be reversed automatically. Use reversible or up/down blocks to make migrations safely downgradable.

## Bad

```ruby
class AddStatusToOrders < ActiveRecord::Migration[7.1]
  def change
    execute "UPDATE orders SET status = 'pending' WHERE status IS NULL"
    add_column :orders, :status, :string, default: "pending"
    # Can't reverse -- execute is irreversible!
  end
end
```


## Good

```ruby
class AddStatusToOrders < ActiveRecord::Migration[7.1]
  def change
    add_column :orders, :status, :string, default: "pending"

    reversible do |dir|
      dir.up do
        execute "UPDATE orders SET status = 'pending' WHERE status IS NULL"
      end
      dir.down do
        # No-op; column removal handles cleanup
      end
    end
  end
end
```


## See Also

- [rails-strong-params](./rails-strong-params.md)
- [proj-ruby-version-file](./proj-ruby-version-file.md)
