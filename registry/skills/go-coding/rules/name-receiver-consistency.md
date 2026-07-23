# name-receiver-consistency

> Use the same receiver name across every method of a type

## Why It Matters

A type's methods are read together as a unit - scattered across a file or package - and readers build a mental model of "the receiver is called `c`" once and reuse it. Varying the receiver name from method to method (`c`, `cl`, `client`, `this`) forces readers to re-map that mental model every time, for no benefit.

## Bad

```go
type Cache struct{ data map[string]string }

func (c *Cache) Get(key string) string      { return c.data[key] }
func (cache *Cache) Set(key, val string)    { cache.data[key] = val }
func (ch *Cache) Delete(key string)          { delete(ch.data, key) }
func (this *Cache) Len() int                 { return len(this.data) }
```

## Good

```go
type Cache struct{ data map[string]string }

func (c *Cache) Get(key string) string   { return c.data[key] }
func (c *Cache) Set(key, val string)     { c.data[key] = val }
func (c *Cache) Delete(key string)       { delete(c.data, key) }
func (c *Cache) Len() int                { return len(c.data) }
```

## `go vet` and `staticcheck` Both Flag This

`staticcheck`'s `ST1016` check ("methods on the same type should have the same receiver name") catches inconsistent receiver names automatically - enable it in `golangci-lint` so this doesn't rely purely on manual review.

## Consistency Across a File, Not Just Adjacent Methods

```go
// Even methods far apart in a large file, or split across multiple files in
// the same package, should share the receiver name - "c" for every *Cache
// method regardless of which file it's defined in.
```

## See Also

- [name-short-receiver](name-short-receiver.md) - Choosing the short name in the first place
- [lint-staticcheck-enabled](lint-staticcheck-enabled.md) - The linter check (`ST1016`) that enforces this automatically
- [type-pointer-vs-value-receiver](type-pointer-vs-value-receiver.md) - Keeping receiver *type* (pointer vs. value) consistent too
