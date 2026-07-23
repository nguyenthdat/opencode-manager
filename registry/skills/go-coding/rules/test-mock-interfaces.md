# test-mock-interfaces

> Depend on small interfaces so hand-written or generated fakes are easy to build

## Why It Matters

Go doesn't have a built-in mocking framework baked into the language the way some ecosystems do; instead, idiomatic Go leans on small interfaces (see `api-small-interfaces`) that are trivial to satisfy with a hand-written fake struct. A well-designed dependency interface makes testing straightforward without needing a heavy mocking library at all.

## Bad

```go
type UserService struct {
	db *sql.DB // concrete dependency: every test needs a real or heavily-mocked *sql.DB
}

func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
	row := s.db.QueryRowContext(ctx, "SELECT * FROM users WHERE id = ?", id)
	return scanUser(row)
}
```

## Good

```go
type UserStore interface {
	GetUser(ctx context.Context, id string) (*User, error)
}

type UserService struct {
	store UserStore // small interface: trivial to fake in tests
}

func (s *UserService) DisplayName(ctx context.Context, id string) (string, error) {
	u, err := s.store.GetUser(ctx, id)
	if err != nil {
		return "", err
	}
	return u.Name, nil
}
```

## A Hand-Written Fake

```go
type fakeUserStore struct {
	users map[string]*User
	err   error
}

func (f *fakeUserStore) GetUser(ctx context.Context, id string) (*User, error) {
	if f.err != nil {
		return nil, f.err
	}
	u, ok := f.users[id]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func TestDisplayName(t *testing.T) {
	store := &fakeUserStore{users: map[string]*User{"1": {Name: "Alice"}}}
	svc := &UserService{store: store}

	name, err := svc.DisplayName(context.Background(), "1")
	if err != nil {
		t.Fatalf("DisplayName: %v", err)
	}
	if name != "Alice" {
		t.Errorf("DisplayName = %q, want %q", name, "Alice")
	}
}
```

## When a Generated Mock Is Worth It

For interfaces with many methods, or when you need call-count/argument-matching assertions, a generator like `go.uber.org/mock/mockgen` (successor to `golang/mock`) or `mockery` produces mocks automatically from an interface definition:

```sh
mockgen -source=store.go -destination=mocks/store_mock.go -package=mocks
```

Reach for generated mocks once hand-written fakes become repetitive across many test files for the same interface - not as the default starting point for every dependency.

## See Also

- [api-small-interfaces](api-small-interfaces.md) - Why small interfaces are what makes this pattern easy in the first place
- [api-accept-interfaces-return-structs](api-accept-interfaces-return-structs.md) - Structuring APIs to accept the interface being faked
- [test-testify-vs-stdlib](test-testify-vs-stdlib.md) - `testify/mock` as an alternative to hand-written fakes
