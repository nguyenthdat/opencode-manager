# test-table-driven

> Structure tests with multiple cases as a table, driven by a single loop

## Why It Matters

Table-driven tests separate test *data* (inputs and expected outputs) from test *logic* (the loop that runs each case), so adding a new case is a one-line addition instead of a copy-pasted test function. It's the dominant Go testing idiom, used throughout the standard library's own test suite.

## Bad

```go
func TestAddPositive(t *testing.T) {
	if got := Add(2, 3); got != 5 {
		t.Errorf("Add(2, 3) = %d, want 5", got)
	}
}

func TestAddNegative(t *testing.T) {
	if got := Add(-2, -3); got != -5 {
		t.Errorf("Add(-2, -3) = %d, want -5", got)
	}
}

func TestAddZero(t *testing.T) {
	if got := Add(0, 0); got != 0 {
		t.Errorf("Add(0, 0) = %d, want 0", got)
	}
}
// Three near-identical functions; adding a case means writing a fourth.
```

## Good

```go
func TestAdd(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"positive", 2, 3, 5},
		{"negative", -2, -3, -5},
		{"zero", 0, 0, 0},
		{"mixed sign", -5, 10, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Add(tt.a, tt.b); got != tt.expected {
				t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}
```

## Table-Driven Tests With Expected Errors

```go
func TestParse(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    int
		wantErr bool
	}{
		{"valid", "42", 42, false},
		{"invalid", "abc", 0, true},
		{"empty", "", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Parse(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("Parse(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if err == nil && got != tt.want {
				t.Errorf("Parse(%q) = %d, want %d", tt.input, got, tt.want)
			}
		})
	}
}
```

## See Also

- [test-subtests-t-run](test-subtests-t-run.md) - The `t.Run` mechanism this pattern relies on
- [test-descriptive-names](test-descriptive-names.md) - Naming each table case clearly
- [test-parallel-t-parallel](test-parallel-t-parallel.md) - Running table cases concurrently for faster suites
