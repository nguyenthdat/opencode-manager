# err-catch-by-const-ref

> Catch exceptions by `const&`, not by value

## Why It Matters

Catching by value slices derived exception types down to the caught base type (losing derived-type information) and incurs an extra copy on every catch. Catching by reference (`const std::exception&`) preserves the exact dynamic type for virtual dispatch (e.g. `.what()`) and avoids the copy entirely.

## Bad

```cpp
try {
    do_work();
} catch (std::exception e) {           // Catch by value: slices FileError down
    std::cerr << e.what();              // to std::exception, losing extra fields,
                                          // and copies the exception object
}
```

## Good

```cpp
try {
    do_work();
} catch (const std::exception& e) {    // No slicing, no copy
    std::cerr << e.what();
}
```

## Ordering: Most-Derived First

```cpp
class FileError : public std::runtime_error {
public:
    explicit FileError(std::string path)
        : std::runtime_error("file error: " + path), path_(std::move(path)) {}
    const std::string& path() const { return path_; }
private:
    std::string path_;
};

try {
    open_file(name);
} catch (const FileError& e) {          // Most-derived caught first
    log_error("failed to open " + e.path());
} catch (const std::exception& e) {     // Base class catches everything else
    log_error(e.what());
}
```

## Rethrowing Preserves the Original Type

```cpp
try {
    do_work();
} catch (const std::exception& e) {
    log_error(e.what());
    throw;   // Re-throws the ORIGINAL exception object and type, not a copy
}
```

## See Also

- [err-custom-exception-hierarchy](err-custom-exception-hierarchy.md) - Designing the hierarchy caught here
- [err-no-catch-all-swallow](err-no-catch-all-swallow.md) - Avoiding empty `catch(...)` blocks
- [anti-slicing-by-value](anti-slicing-by-value.md) - Object slicing in general, not just exceptions
