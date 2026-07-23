# test-golden-files

> Use golden files to test large or complex expected output

## Why It Matters

Inlining a large expected output (a formatted report, rendered HTML, a serialized struct) directly in test source as a string literal is unwieldy to read, review, and update. Golden files store the expected output in a separate file that's compared byte-for-byte against actual output, and can be regenerated automatically with a flag when the expected output legitimately changes.

## Bad

```go
func TestRenderReport(t *testing.T) {
	got := RenderReport(sampleData)
	want := "Report\n======\nName: Alice\nAge: 30\nStatus: active\n...(200 more lines)...\n"
	if got != want {
		t.Errorf("RenderReport() mismatch") // and the diff is buried in a giant inline string
	}
}
```

## Good

```go
var update = flag.Bool("update", false, "update golden files")

func TestRenderReport(t *testing.T) {
	got := RenderReport(sampleData)
	golden := filepath.Join("testdata", "report.golden")

	if *update {
		if err := os.WriteFile(golden, []byte(got), 0o644); err != nil {
			t.Fatalf("update golden file: %v", err)
		}
	}

	want, err := os.ReadFile(golden)
	if err != nil {
		t.Fatalf("read golden file: %v", err)
	}
	if diff := cmp.Diff(string(want), got); diff != "" {
		t.Errorf("RenderReport() mismatch (-want +got):\n%s", diff)
	}
}
```

Regenerating golden files after an intentional output change:

```sh
go test -run TestRenderReport -update ./...
```

## Conventions

- Store golden files under `testdata/` - the Go toolchain ignores this directory during builds, so it's safe for arbitrary fixture content.
- Name golden files after the test and scenario (`testdata/report_empty.golden`, `testdata/report_full.golden`).
- Always review a diff of regenerated golden files in code review - regenerating silently accepts whatever the code currently produces, bugs included.

## See Also

- [test-table-driven](test-table-driven.md) - Combining golden files with multiple named scenarios
- [gen-maps-package](gen-maps-package.md) - Deterministic (sorted) output matters for stable golden-file comparisons
- [proj-standard-layout](proj-standard-layout.md) - `testdata/` as part of Go's recognized project layout conventions
