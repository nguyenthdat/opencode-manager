# anti-premature-interface

> Don't define an interface before a second implementation actually exists

## Why It Matters

"Accept interfaces" is good advice at the point of *use*, not a license to define an interface the moment you write a concrete type, on the theory that you might swap it out later. A speculative interface with exactly one implementation adds a layer of indirection, an extra file, and an extra name to keep in sync - all for a flexibility need that may never materialize, and that's trivial to add later, when a real second implementation (or a real testing need) actually shows up.

## Bad

```go
// Defined the moment PostgresStore was written, with no other implementation
// in sight and no concrete testing need driving it yet.
type Store interface {
	Get(id string) (*Item, error)
	Set(id string, item *Item) error
	Delete(id string) error
	List() ([]*Item, error)
}

type PostgresStore struct{ db *sql.DB }

func (s *PostgresStore) Get(id string) (*Item, error)      { /* ... */ return nil, nil }
func (s *PostgresStore) Set(id string, i *Item) error       { /* ... */ return nil }
func (s *PostgresStore) Delete(id string) error             { /* ... */ return nil }
func (s *PostgresStore) List() ([]*Item, error)             { /* ... */ return nil, nil }

func NewService(store Store) *Service { // parameter typed against a speculative interface
	return &Service{store: store}
}
```

## Good

```go
type PostgresStore struct{ db *sql.DB }

func (s *PostgresStore) Get(id string) (*Item, error) { /* ... */ return nil, nil }
func (s *PostgresStore) Set(id string, i *Item) error   { /* ... */ return nil }

func NewService(store *PostgresStore) *Service { // concrete type: no interface needed yet
	return &Service{store: store}
}

// Once a real second need appears - an in-memory test double, a second
// backend - define the interface AT THAT POINT, scoped to exactly what
// the consumer (Service) actually calls:
type Store interface {
	Get(id string) (*Item, error)
	Set(id string, i *Item) error
}

func NewService(store Store) *Service {
	return &Service{store: store}
}
```

## The Exception: You Already Know Multiple Implementations Are Coming

If you're building a plugin system, a driver abstraction (like `database/sql`'s `driver.Driver`), or you already have a second concrete implementation in hand (not hypothetical), defining the interface up front is legitimate - the anti-pattern is specifically defining one *speculatively*, "just in case," with no concrete second use yet.

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Sizing the interface correctly once it's genuinely needed
- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - The general shape this interface takes once it's warranted
- [api-minimal-exported-surface](api-minimal-exported-surface.md) - The broader principle of not exposing abstractions before they're needed
