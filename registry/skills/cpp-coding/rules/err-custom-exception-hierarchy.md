# err-custom-exception-hierarchy

> Derive custom exceptions from `std::exception`

## Why It Matters

Deriving custom exception types from `std::exception` (typically via `std::runtime_error`/`std::logic_error`) lets callers who don't know your specific error types still catch and inspect them meaningfully via `.what()`, and lets library-wide code catch `const std::exception&` as a safety net. A custom type that doesn't derive from `std::exception` can only be caught by its exact type or `catch(...)`, which discards all information.

## Bad

```cpp
struct FileError {   // Doesn't derive from std::exception
    std::string message;
};

void open(const std::string& path) {
    if (!exists(path)) throw FileError{"not found: " + path};
}

try {
    open("missing.txt");
} catch (const std::exception& e) {
    // Never catches FileError! It isn't a std::exception at all.
    log(e.what());
}
```

## Good

```cpp
class FileError : public std::runtime_error {
public:
    explicit FileError(const std::string& path)
        : std::runtime_error("file error: " + path), path_(path) {}

    const std::string& path() const noexcept { return path_; }

private:
    std::string path_;
};

void open(const std::string& path) {
    if (!exists(path)) throw FileError(path);
}

try {
    open("missing.txt");
} catch (const FileError& e) {          // Specific handling with extra context
    log_error("file error for " + e.path());
} catch (const std::exception& e) {     // Safety net for anything else
    log_error(e.what());
}
```

## A Small Library-Wide Hierarchy

```cpp
class AppError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

class NetworkError : public AppError {
public:
    using AppError::AppError;
};

class ParseError : public AppError {
public:
    using AppError::AppError;
};

// Callers can catch AppError to handle all of this library's failures,
// or std::exception to handle anything, including third-party exceptions.
```

## See Also

- [err-catch-by-const-ref](err-catch-by-const-ref.md) - Catching these types correctly
- [err-error-context-preserve](err-error-context-preserve.md) - Preserving cause information when wrapping
- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - When exceptions are the right tool at all
