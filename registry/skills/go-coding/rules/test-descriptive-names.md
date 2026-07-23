# test-descriptive-names

> Name tests and subtests after the behavior being verified, not generic labels

## Why It Matters

A test named `TestUser1` or a subtest named `"case1"` tells a reader (and a CI failure notification) nothing about what actually broke - they have to open the test source and read the body to find out. A descriptive name (`TestValidate_RejectsEmptyEmail`, `"missing @ sign"`) makes a failing test's purpose obvious from the test report alone, before ever opening an editor.

## Bad

```go
func TestUser1(t *testing.T) { ... }
func TestUser2(t *testing.T) { ... }

func TestValidate(t *testing.T) {
	cases := []struct {
		name  string
		input string
		valid bool
	}{
		{"case1", "a@b.com", true},
		{"case2", "invalid", false},
		{"case3", "", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) { ... })
	}
}
```

## Good

```go
func TestFetchUser_ReturnsErrNotFoundForMissingID(t *testing.T) { ... }
func TestFetchUser_ReturnsUserForValidID(t *testing.T) { ... }

func TestValidate(t *testing.T) {
	cases := []struct {
		name  string
		input string
		valid bool
	}{
		{"valid email", "a@b.com", true},
		{"missing at sign", "invalid", false},
		{"empty string", "", false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) { ... })
	}
}
```

## A Common, Readable Convention: `TestSubject_Scenario`

```go
func TestParse_ReturnsErrorForMalformedInput(t *testing.T) { ... }
func TestParse_TrimsLeadingWhitespace(t *testing.T)        { ... }
func TestParse_HandlesEmptyString(t *testing.T)             { ... }
```

The underscore here separates "what's under test" from "the scenario," which is one of the few widely-accepted uses of an underscore in an otherwise MixedCaps-only naming convention (see `name-avoid-underscores`).

## What a Good Test Name Communicates

- **What** is being tested (the function/method/behavior).
- **Under what condition** (the specific input or state).
- **What's expected** (the outcome), when it isn't already obvious from the first two parts.

A test failure report like `--- FAIL: TestFetchUser_ReturnsErrNotFoundForMissingID` tells you exactly what regressed, without opening the file.

## See Also

- [test-table-driven](test-table-driven.md) - Naming individual cases within a table-driven test
- [name-avoid-underscores](name-avoid-underscores.md) - Why the `Test_Scenario` underscore convention is a deliberate, narrow exception
- [test-helper-marker](test-helper-marker.md) - Clear failure attribution, which pairs naturally with a clear test name
