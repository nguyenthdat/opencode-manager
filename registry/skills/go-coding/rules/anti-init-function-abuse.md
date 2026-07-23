# anti-init-function-abuse

> Don't overload `init()` with side effects or logic that could fail

## Why It Matters

`init()` functions run automatically, in an order controlled by import dependencies rather than anything the caller decides, before `main()` even starts - and they can't return an error or accept parameters. Putting meaningful logic (especially anything that can fail, like opening a network connection or reading a required file) in `init()` means failures happen at a moment the caller has no way to catch or control, often producing an unhelpful panic during process startup with no context about which import triggered it.

## Bad

```go
package db

var conn *sql.DB

func init() {
	var err error
	conn, err = sql.Open("postgres", os.Getenv("DATABASE_URL")) // can fail, silently
	if err != nil {
		panic(err) // panics during package initialization - before main() even runs,
	}              // with no way for the importing program to handle this gracefully
}
```

```go
package flags

func init() {
	flag.StringVar(&configPath, "config", "config.yaml", "path to config file")
	// Registering flags in init() is a common, more benign pattern, but still
	// makes flag registration order dependent on import order across packages.
}
```

## Good

```go
package db

func Connect(dsn string) (*sql.DB, error) {
	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}
	return conn, nil
}
```

```go
func main() {
	conn, err := db.Connect(os.Getenv("DATABASE_URL")) // failure is visible, handleable, and happens at a clear point
	if err != nil {
		log.Fatalf("startup failed: %v", err)
	}
	defer conn.Close()
	// ...
}
```

## Where `init()` Is Genuinely Appropriate

```go
func init() {
	// Registering a driver with a well-known registry, where the registration
	// itself cannot fail and the side effect is the entire point (this is
	// exactly how database/sql drivers register themselves):
	sql.Register("mydriver", &myDriver{})
}

var validEmailPattern = regexp.MustCompile(`^[^@]+@[^@]+$`) // package-level var init, not even inside init() - simpler still
```

## Rule of Thumb

Reserve `init()` for registration-style side effects that cannot fail and whose ordering relative to other packages' `init()` functions doesn't matter. Anything that can fail, needs configuration input, or should be under the calling program's control belongs in an explicit function the caller invokes from `main()`, where errors can be handled properly.

## See Also

- [api-avoid-global-state](api-avoid-global-state.md) - The broader caution around package-level state `init()` often populates
- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - Why panicking during package init is especially unhelpful
- [proj-main-thin](proj-main-thin.md) - Where startup wiring and error handling should actually live instead
