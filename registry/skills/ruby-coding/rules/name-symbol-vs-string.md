# name-symbol-vs-string

> Use symbols for identifiers, strings for data

## Why It Matters

Symbols are immutable identifiers (labels, keys, statuses). Strings are for user-facing data. Using strings where symbols belong wastes memory and makes comparison slower.

## Bad

```ruby
statuses = ["active", "inactive", "pending"]
config = { "host" => "localhost", "port" => 3000 }
```


## Good

```ruby
statuses = [:active, :inactive, :pending]
config = { host: "localhost", port: 3000 }  # Symbol keys via shorthand
# Strings for data:
name = "Alice"
message = "Hello, world!"
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
