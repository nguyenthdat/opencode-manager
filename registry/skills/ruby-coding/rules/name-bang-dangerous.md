# name-bang-dangerous

> End dangerous/mutating methods with !

## Why It Matters

The ! suffix marks methods that are 'dangerous' -- they mutate the receiver, raise exceptions instead of returning nil, or have surprising behavior. Always provide a non-bang safer counterpart.

## Bad

```ruby
def sort; @items.sort!; end  # Mutating, but no ! suffix
def save(record); record.save!; end  # Raises but no ! suffix
```


## Good

```ruby
def sort; items.dup.sort; end  # Safe version -- returns copy
def sort!; @items = items.sort; self; end  # Mutating
def save(record); record.save; end  # Returns boolean
def save!(record); record.save!; end   # Raises on failure
```


## See Also

- [name-predicate-question](./name-predicate-question.md)
- [api-bang-methods](./api-bang-methods.md)
