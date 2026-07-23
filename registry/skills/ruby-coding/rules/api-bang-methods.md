# api-bang-methods

> Use ! suffix for dangerous/mutating versions

## Why It Matters

The `!` suffix conventionally marks methods that are more dangerous than their non-bang counterpart — typically because they mutate the receiver, raise an exception instead of returning nil, or have surprising side effects. Always provide a safe (non-bang) alternative when creating a bang method.

## Bad

```ruby
def save(record); record.save; end  # Returns true/false
def save!(record); record.save; end  # Just calls save -- misleading!
def process!; end  # No non-bang counterpart -- what's dangerous?
```

## Good

```ruby
def save(record); record.save; end    # Returns true/false
def save!(record); record.save!; end  # Raises on failure
def sort; items.dup.sort; end          # Returns sorted copy
def sort!; @items = items.sort; self; end  # Mutates receiver
def find(id); records.find { |r| r.id == id }; end  # Returns nil
def find!(id); records.find { |r| r.id == id } || raise(NotFoundError); end
```

## See Also

- [name-bang-dangerous](./name-bang-dangerous.md)
- [api-predicate-methods](./api-predicate-methods.md)
