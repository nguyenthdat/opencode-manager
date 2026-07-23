# err-error-context

> Attach context to errors instead of throwing bare cases

## Why It Matters

A bare error case like `.notFound` or `.invalidInput` tells the catcher *that* something failed but not *which* thing, making logs and debugging sessions far harder than necessary. Attaching context — the ID that wasn't found, the field that failed validation, the underlying error that triggered a wrapper — costs one associated value and pays for itself the first time someone has to diagnose a production issue from a log line alone.

## Bad

```swift
enum RepositoryError: Error {
    case notFound
    case invalidInput
    case saveFailed
}

func find(id: String) throws -> Record {
    guard let record = database.query(id) else {
        throw RepositoryError.notFound   // Not found... which id?
    }
    return record
}
```

## Good

```swift
enum RepositoryError: Error {
    case notFound(id: String)
    case invalidInput(field: String, reason: String)
    case saveFailed(underlying: Error)
}

func find(id: String) throws -> Record {
    guard let record = database.query(id) else {
        throw RepositoryError.notFound(id: id)
    }
    return record
}

func save(_ record: Record) throws {
    do {
        try database.write(record)
    } catch {
        throw RepositoryError.saveFailed(underlying: error)
    }
}

// Now a log line is actually actionable
catch RepositoryError.notFound(let id) {
    log.warning("Record \(id) not found")
}
```

## Wrapping Underlying Errors Without Losing Them

```swift
enum SyncError: Error {
    case uploadFailed(fileName: String, underlying: Error)
}

func upload(_ file: File) throws {
    do {
        try network.send(file.data)
    } catch {
        // Preserve the original error instead of discarding it
        throw SyncError.uploadFailed(fileName: file.name, underlying: error)
    }
}

// The underlying error is still inspectable at the catch site
catch SyncError.uploadFailed(let name, let underlying) {
    log.error("Upload of \(name) failed: \(underlying)")
}
```

As a rule of thumb: if you find yourself writing a log statement right next to a `throw` to capture "the thing this happened to," that value belongs in the error's associated value instead.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - the enum shape context is attached to
- [`err-localized-error`](err-localized-error.md) - surface context in a user-facing message
- [`err-never-swallow`](err-never-swallow.md) - context is wasted if the error is discarded anyway
