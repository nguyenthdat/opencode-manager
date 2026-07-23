# api-accept-interfaces-return-structs

> Accept interfaces as parameters, return concrete structs

## Why It Matters

Accepting an interface parameter lets callers pass any implementation - a real client, a mock, an in-memory fake - without your function caring. Returning a concrete struct gives *callers* the full set of methods and fields available, instead of limiting them to whatever narrow interface you happened to return, which they'd then have to type-assert to get more out of.

## Bad

```go
// Accepting a concrete type ties every caller to *sql.DB specifically -
// no way to substitute a mock or a wrapper in tests.
func GetUser(db *sql.DB, id string) (*User, error) {
	return queryUser(db, id)
}

// Returning an interface hides the concrete type's extra methods/fields from
// callers, forcing type assertions to get anything beyond the interface.
func NewStore() Store {
	return &memStore{data: map[string]string{}}
}
```

## Good

```go
type Querier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func GetUser(ctx context.Context, q Querier, id string) (*User, error) { // accepts an interface
	row := q.QueryRowContext(ctx, "SELECT * FROM users WHERE id = ?", id)
	return scanUser(row)
}

type MemStore struct { // returns the concrete type
	mu   sync.Mutex
	data map[string]string
}

func NewMemStore() *MemStore {
	return &MemStore{data: map[string]string{}}
}
```

## Why This Enables Testing

```go
type fakeQuerier struct{}

func (fakeQuerier) QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row {
	// return a canned row for tests
	return nil
}

func TestGetUser(t *testing.T) {
	_, err := GetUser(context.Background(), fakeQuerier{}, "42")
	// no real database needed
}
```

## The Exception: Well-Known Standard Interfaces

Returning a standard, widely-understood interface (`io.Reader`, `io.Writer`, `error`) is fine and idiomatic - the "return structs" guidance is about your own bespoke interfaces, not the stdlib's minimal, universally-recognized ones.

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Keeping the accepted interface minimal
- [test-mock-interfaces](test-mock-interfaces.md) - Building test doubles that satisfy the accepted interface
- [api-io-reader-writer](api-io-reader-writer.md) - The most common concrete case of this rule
