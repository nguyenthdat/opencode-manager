# doc-example-tests

> Write `Example` functions so documentation examples are compiled and verified

## Why It Matters

A code sample written as a plain comment in a doc string can drift out of sync with the actual API over time - nothing checks that it still compiles or produces the output it claims. An `Example` function in a `_test.go` file is compiled, and if it has an `// Output:` comment, `go test` actually runs it and verifies the printed output matches - so the documentation example can never silently go stale.

## Bad

```go
// Parse parses a duration string like "1h30m".
//
// Example usage:
//   d := Parse("1h30m")
//   fmt.Println(d) // prints "1h30m0s"
//
// (This is just a comment - nothing verifies it still compiles or is correct.)
func Parse(s string) (time.Duration, error) { ... }
```

## Good

```go
// Parse parses a duration string like "1h30m".
func Parse(s string) (time.Duration, error) { ... }
```

```go
// parse_test.go

func ExampleParse() {
	d, err := Parse("1h30m")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(d)
	// Output: 1h30m0s
}
```

`pkg.go.dev` and `go doc` render `ExampleParse` directly alongside the `Parse` documentation, and `go test` fails the build if the actual output ever diverges from the `// Output:` comment.

## Naming Convention Ties an Example to Its Subject

```go
func Example()                    // package-level example
func ExampleParse()                // example for function Parse
func ExampleClient_FetchUser()     // example for method FetchUser on type Client
func ExampleClient_FetchUser_error() // a second, differently-named example for the same method
```

## Unordered Output

```go
func ExampleKeys() {
	m := map[string]int{"a": 1, "b": 2}
	keys := slices.Sorted(maps.Keys(m))
	fmt.Println(keys)
	// Unordered output: [a b]
	// (use "Unordered output:" when the underlying operation's order isn't guaranteed)
}
```

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The doc comment this example accompanies
- [test-table-driven](test-table-driven.md) - Regular tests for behavior verification beyond what an Example demonstrates
- [doc-godoc-formatting](doc-godoc-formatting.md) - Formatting conventions for the surrounding doc comment text
