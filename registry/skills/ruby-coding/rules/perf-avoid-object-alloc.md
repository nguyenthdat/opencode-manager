# perf-avoid-object-alloc

> Reuse objects in hot loops; avoid allocations

## Why It Matters

Object allocation in hot loops (10K+ iterations) causes GC pressure. Reuse collections with clear, use mutating methods, and pre-allocate. Avoid creating hashes/arrays inside tight loops.

## Bad

```ruby
# Allocates new array and hash per iteration:
users.each do |user|
  data = { id: user.id, name: user.name }
  results = [user.name, user.email]
  process(data, results)
end
```


## Good

```ruby
# Reuse objects:
results = []
data = {}
users.each do |user|
  data[:id] = user.id
  data[:name] = user.name
  results.replace([user.name, user.email])
  process(data, results)
end
```


## See Also

- [perf-bang-versions](./perf-bang-versions.md)
- [perf-string-concat](./perf-string-concat.md)
