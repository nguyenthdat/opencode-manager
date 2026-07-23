# perf-avoid-string-concat-loop

> Avoid repeated `String` concatenation in loops

## Why It Matters

Each `+=` or `+` on a `String` inside a loop can trigger storage growth and copying if capacity wasn't reserved, and building output via repeated concatenation obscures the final size the runtime needs to plan for. Using `reserveCapacity`, a single `joined(separator:)`, or writing into a `String` via `append` while reserved capacity avoids the repeated reallocation that naive concatenation causes.

## Bad

```swift
func renderRow(_ columns: [String]) -> String {
    var row = ""
    for column in columns {
        row = row + column + "\t" // repeated allocation & copy of the growing string
    }
    return row
}

func buildReport(_ lines: [String]) -> String {
    var report = ""
    for line in lines {
        report += line + "\n"
    }
    return report
}
```

## Good

```swift
func renderRow(_ columns: [String]) -> String {
    columns.joined(separator: "\t") + "\t" // one pass, one allocation
}

func buildReport(_ lines: [String]) -> String {
    lines.map { $0 + "\n" }.joined() // or, better still:
}

func buildReportReserved(_ lines: [String]) -> String {
    var report = ""
    report.reserveCapacity(lines.reduce(0) { $0 + $1.utf8.count + 1 })
    for line in lines {
        report.append(line)
        report.append("\n")
    }
    return report
}
```

## Using `String(contentsOf:)`-Style Builders for Very Large Output

```swift
// For large, structured output, build once with reserved capacity rather
// than accumulating many small concatenations, and prefer interpolation
// over chained `+` when combining a few values (interpolation compiles
// to efficient buffer writes, not repeated string allocation):
func describe(_ user: User) -> String {
    "\(user.name) <\(user.email)> - \(user.role)" // one interpolated String
}

// Avoid this equivalent but slower chain of temporary strings:
func describeSlow(_ user: User) -> String {
    user.name + " <" + user.email + "> - " + user.role
}
```

## See Also

- [`perf-reserve-capacity`](perf-reserve-capacity.md) - Reserving capacity before appending
- [`perf-profile-instruments`](perf-profile-instruments.md) - Confirming string building is a bottleneck
- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - `String`'s copy-on-write value semantics
