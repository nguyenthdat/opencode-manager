# test-fuzz-testing

> Use `testing.F` fuzz tests to find edge cases in parsing/decoding code

## Why It Matters

Hand-written test cases only cover inputs you thought to write. Native fuzzing (stable since Go 1.18) generates random and mutated inputs automatically, guided by code coverage, and is especially effective at finding crashes, panics, and invariant violations in parsers, decoders, and other functions that handle untrusted input.

## Bad

```go
func TestParse(t *testing.T) {
	// Only the cases a human thought of - a parser bug on some unusual byte
	// sequence or edge-case length could go undetected indefinitely.
	cases := []string{"valid", "", "123"}
	for _, c := range cases {
		Parse(c)
	}
}
```

## Good

```go
func FuzzParse(f *testing.F) {
	// Seed corpus: known interesting inputs to start mutating from.
	f.Add("valid")
	f.Add("")
	f.Add("123")
	f.Add(strings.Repeat("a", 1000))

	f.Fuzz(func(t *testing.T, input string) {
		// The property being checked: Parse must never panic, regardless of input.
		defer func() {
			if r := recover(); r != nil {
				t.Fatalf("Parse(%q) panicked: %v", input, r)
			}
		}()
		_, _ = Parse(input)
	})
}
```

Running the fuzzer (not part of the normal `go test` run by default):

```sh
go test -fuzz=FuzzParse -fuzztime=60s ./...
```

## Fuzzing a Round-Trip Property

```go
func FuzzEncodeDecode(f *testing.F) {
	f.Add([]byte("hello"))
	f.Fuzz(func(t *testing.T, data []byte) {
		encoded := Encode(data)
		decoded, err := Decode(encoded)
		if err != nil {
			t.Fatalf("Decode failed on Encode's own output: %v", err)
		}
		if !bytes.Equal(decoded, data) {
			t.Fatalf("round-trip mismatch: got %q, want %q", decoded, data)
		}
	})
}
```

## Regression Corpus

When the fuzzer finds a failing input, it's automatically saved under `testdata/fuzz/<FuzzTestName>/` and replayed on every subsequent `go test` run - commit these files so the specific crash never regresses silently.

## See Also

- [test-table-driven](test-table-driven.md) - Deterministic example-based tests that fuzzing complements, not replaces
- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - The exact class of bug (unexpected panics on bad input) fuzzing targets
- [test-golden-files](test-golden-files.md) - Committed fixtures, similar in spirit to a fuzzer's saved failing-input corpus
