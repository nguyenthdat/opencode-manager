# lint-shadow-check

> Enable the `shadow` analyzer to catch accidental variable shadowing

## Why It Matters

Go's `:=` inside a nested block (an `if`, `for`, or inline closure) creates a new variable if the name isn't already declared in that exact block scope - even if an outer scope already has a variable with the same name. This is by design and usually harmless, but it's an easy trap specifically with `err`, where a shadowed inner `err` can leave an outer `err` variable looking like it was checked when it wasn't. The `shadow` analyzer (not in `go vet`'s default set, but available via `golangci-lint`) flags these cases.

## Bad

```go
func process() (err error) {
	if data, err := fetch(); err != nil { // shadows the named return value `err`
		return err // this return correctly uses the shadowed inner err...
	} else {
		use(data)
	}
	return err // ...but THIS refers to the outer, still-nil named return - the shadow analyzer flags the := above
}
```

## Good

```go
func process() (err error) {
	var data []byte
	data, err = fetch() // no shadowing: assigns directly to the named return
	if err != nil {
		return err
	}
	use(data)
	return nil
}
```

## Enabling the Check

```yaml
# .golangci.yml
linters-settings:
  govet:
    enable:
      - shadow
```

```sh
golangci-lint run --enable=govet ./...
# main.go:3:20: declaration of "err" shadows declaration at line 2
```

## Shadowing Isn't Always a Bug

```go
data, err := os.ReadFile(path) // fine: fully handled within this scope, immediately
if err != nil {
	return err
}
```

The `shadow` analyzer can be noisy on legitimate, fully-self-contained shadowing (the extremely common `if x, err := f(); err != nil` idiom used and handled entirely within one block). Many teams enable it project-wide but tune expectations, or apply it more narrowly to functions with named returns where the bug pattern above is most dangerous.

## See Also

- [err-avoid-shadowing](err-avoid-shadowing.md) - The specific bug pattern this analyzer targets
- [lint-govet-enabled](lint-govet-enabled.md) - Where the shadow analyzer plugs into the broader `go vet` toolset
- [err-check-immediately](err-check-immediately.md) - Handling errors in the same scope, reducing the risk of relying on shadowed state
