# test-testify-vs-stdlib

> Choose `testify` assertions or stdlib `testing` deliberately, and stay consistent

## Why It Matters

The stdlib `testing` package alone is sufficient for every kind of test and adds zero dependencies, but writing comparison/error-handling boilerplate by hand for every assertion is verbose. `testify`'s `assert`/`require` packages trade a dependency for concise, readable assertions with good failure messages. Neither choice is universally "correct" - the mistake is mixing both styles inconsistently within the same codebase.

## Bad

```go
// Half the test suite uses testify, half uses raw stdlib comparisons -
// readers have to context-switch styles from file to file.
func TestA(t *testing.T) {
	assert.Equal(t, 5, Add(2, 3))
}

func TestB(t *testing.T) {
	if got := Add(2, 3); got != 5 {
		t.Errorf("Add(2, 3) = %d, want 5", got)
	}
}
```

## Good: Stdlib-Only (Zero Dependencies)

```go
func TestAdd(t *testing.T) {
	if got, want := Add(2, 3), 5; got != want {
		t.Errorf("Add(2, 3) = %d, want %d", got, want)
	}
}

func TestParse(t *testing.T) {
	_, err := Parse("invalid")
	if err == nil {
		t.Fatal("Parse(\"invalid\") should have returned an error")
	}
}
```

## Good: `testify` Consistently

```go
import "github.com/stretchr/testify/require"

func TestAdd(t *testing.T) {
	require.Equal(t, 5, Add(2, 3))
}

func TestParse(t *testing.T) {
	_, err := Parse("invalid")
	require.Error(t, err) // require.* stops the test immediately on failure, unlike assert.*
}
```

## `assert` vs. `require`

```go
// assert.* records a failure and continues the test - useful for checking
// several independent properties in one test function.
assert.Equal(t, 5, result.Count)
assert.True(t, result.Success)

// require.* stops the test immediately - use it when a later assertion would
// panic or be meaningless if this one fails (e.g., a nil check before dereferencing).
user := fetchUser(t, id)
require.NotNil(t, user)
assert.Equal(t, "Alice", user.Name) // safe: we already required user != nil
```

## Rule of Thumb

For libraries intended for broad external use, stdlib-only testing avoids imposing a test dependency on downstream consumers who vendor or audit dependencies strictly. For application code and internal test suites, `testify` (or a similar assertion library) is a reasonable, widely-adopted convenience - pick one approach per repository and apply it uniformly.

## See Also

- [test-table-driven](test-table-driven.md) - Table-driven tests work identically with either style
- [test-mock-interfaces](test-mock-interfaces.md) - `testify/mock` as a related but separate concern from assertions
- [test-descriptive-names](test-descriptive-names.md) - Clear failure messages matter regardless of assertion style
