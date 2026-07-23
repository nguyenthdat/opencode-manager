# perf-array-literal

> Use %w/%i literals for arrays of strings/symbols

## Why It Matters

%w (word array) and %i (symbol array) are faster to parse and read than quoted arrays. %w treats each word as a string; %i as a symbol. No commas or quotes needed.

## Bad

```ruby
STATUSES = ["pending", "confirmed", "shipped", "delivered"]
ROLES = [:admin, :moderator, :member, :guest]
```


## Good

```ruby
STATUSES = %w[pending confirmed shipped delivered]
ROLES = %i[admin moderator member guest]
# With interpolation (uppercase):
TYPES = %W[#{prefix}_pending #{prefix}_active]
```


## See Also

- [perf-string-concat](./perf-string-concat.md)
- [name-symbol-vs-string](./name-symbol-vs-string.md)
