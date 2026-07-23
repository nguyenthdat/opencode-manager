# test-subtests-t-run

> Use `t.Run` to create named, independently-reportable subtests

## Why It Matters

`t.Run("name", func(t *testing.T) {...})` creates a subtest that reports pass/fail independently, can be run in isolation with `go test -run TestX/name`, and gets its own `t.Parallel()` scope. Without it, a single failing case in a loop just reports one generic failure for the whole test function, and you can't target a specific case from the command line.

## Bad

```go
func TestValidate(t *testing.T) {
	cases := []struct {
		input string
		valid bool
	}{
		{"valid@example.com", true},
		{"invalid", false},
	}
	for _, c := range cases {
		if got := Validate(c.input); got != c.valid {
			t.Errorf("Validate(%q) = %v, want %v", c.input, got, c.valid) // no case name in the test tree
		}
	}
}
```

## Good

```go
func TestValidate(t *testing.T) {
	cases := []struct {
		name  string
		input string
		valid bool
	}{
		{"valid email", "valid@example.com", true},
		{"missing at sign", "invalid", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Validate(c.input); got != c.valid {
				t.Errorf("Validate(%q) = %v, want %v", c.input, got, c.valid)
			}
		})
	}
}
```

Running a single named subtest from the command line:

```sh
go test -run 'TestValidate/missing_at_sign' ./...
```

## The Loop Variable Capture Pitfall (Pre-Go 1.22)

```go
// Before Go 1.22, the loop variable was shared across iterations, so a
// t.Run closure could capture the WRONG case if it ran asynchronously
// relative to the loop (e.g., combined with t.Parallel without a fix):
for _, c := range cases {
	t.Run(c.name, func(t *testing.T) {
		t.Parallel()
		// pre-1.22: needed `c := c` here to avoid all parallel subtests
		// sharing the loop's final value of c
		use(c)
	})
}
```

Go 1.22+ gives each iteration its own `c`, so this capture bug no longer applies to code built with a `go.mod` `go` directive of 1.22 or later - but it's worth recognizing in code that must support older toolchains.

## See Also

- [test-table-driven](test-table-driven.md) - The table structure that pairs naturally with `t.Run`
- [test-parallel-t-parallel](test-parallel-t-parallel.md) - Running subtests concurrently
- [name-avoid-underscores](name-avoid-underscores.md) - `t.Run` names become part of the test's slash-separated path
