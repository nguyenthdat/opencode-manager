# perf-reserve-capacity

> Use `reserveCapacity` when the final collection size is known

## Why It Matters

`Array`, `Set`, `Dictionary`, and `String` all grow their backing storage geometrically, which means appending to an unreserved collection triggers a handful of reallocate-and-copy cycles as it grows past each capacity threshold. When the final (or an upper-bound) size is known ahead of time, calling `reserveCapacity` allocates once, eliminating those intermediate copies entirely.

## Bad

```swift
func parseLines(_ text: String) -> [String] {
    var lines: [String] = []
    for line in text.split(separator: "\n") {
        lines.append(String(line)) // repeated reallocation as lines.count grows
    }
    return lines
}

func buildIndex(for words: [String]) -> [String: Int] {
    var index: [String: Int] = [:]
    for (position, word) in words.enumerated() {
        index[word] = position // Dictionary rehashes repeatedly
    }
    return index
}
```

## Good

```swift
func parseLines(_ text: String) -> [String] {
    let rawLines = text.split(separator: "\n")
    var lines: [String] = []
    lines.reserveCapacity(rawLines.count) // single allocation up front
    for line in rawLines {
        lines.append(String(line))
    }
    return lines
}

func buildIndex(for words: [String]) -> [String: Int] {
    var index: [String: Int] = [:]
    index.reserveCapacity(words.count)
    for (position, word) in words.enumerated() {
        index[word] = position
    }
    return index
}
```

## Reserving for `String` and Using `Array(unsafeUninitializedCapacity:)`

```swift
func joined(_ parts: [String], separator: String) -> String {
    let totalLength = parts.reduce(0) { $0 + $1.utf8.count }
        + separator.utf8.count * max(0, parts.count - 1)

    var result = ""
    result.reserveCapacity(totalLength)
    for (index, part) in parts.enumerated() {
        if index > 0 { result += separator }
        result += part
    }
    return result
}

// When constructing from a known count with a computed rule, this avoids
// even the append-based growth path entirely.
func squares(upTo n: Int) -> [Int] {
    Array(unsafeUninitializedCapacity: n) { buffer, initializedCount in
        for i in 0..<n {
            buffer[i] = i * i
        }
        initializedCount = n
    }
}
```

## See Also

- [`perf-contiguous-array`](perf-contiguous-array.md) - Choosing storage that avoids bridging overhead
- [`perf-avoid-string-concat-loop`](perf-avoid-string-concat-loop.md) - Avoiding repeated string concatenation
- [`perf-profile-instruments`](perf-profile-instruments.md) - Confirming allocation is actually the bottleneck
