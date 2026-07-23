# raii-scope-bound-resources

> Bind every resource to a scope-owning object (RAII)

## Why It Matters

Every resource — memory, file handle, mutex, socket, database connection — should be owned by an object whose destructor releases it. This guarantees the resource is freed on every exit path: normal return, early return, or exception unwinding. Manual acquire/release pairs are one missed `return` away from a leak.

## Bad

```cpp
void process_file(const char* path) {
    FILE* f = std::fopen(path, "r");
    if (!f) throw std::runtime_error("open failed");

    if (needs_early_exit(f)) {
        return;              // Leaks the FILE*!
    }

    read_data(f);             // If this throws, f also leaks
    std::fclose(f);
}
```

## Good

```cpp
#include <memory>

struct FileCloser {
    void operator()(std::FILE* f) const noexcept { if (f) std::fclose(f); }
};
using FilePtr = std::unique_ptr<std::FILE, FileCloser>;

void process_file(const char* path) {
    FilePtr f(std::fopen(path, "r"));
    if (!f) throw std::runtime_error("open failed");

    if (needs_early_exit(*f)) {
        return;               // f's destructor closes the file
    }

    read_data(f.get());       // Closed on throw too
}                              // Closed on normal exit
```

## Applies to More Than Memory

```cpp
// Mutex: RAII via lock_guard
std::mutex m;
void update() {
    std::lock_guard lock(m);
    // ... critical section ...
}   // unlocked automatically

// Database transaction: RAII wrapper
class Transaction {
public:
    explicit Transaction(Db& db) : db_(db) { db_.begin(); }
    ~Transaction() { if (!committed_) db_.rollback(); }
    void commit() { db_.commit(); committed_ = true; }
private:
    Db& db_;
    bool committed_ = false;
};
```

## See Also

- [raii-rule-of-zero](raii-rule-of-zero.md) - Let compiler-generated members do the work
- [raii-custom-deleter](raii-custom-deleter.md) - Wrap non-memory resources with unique_ptr
- [raii-file-handle-wrap](raii-file-handle-wrap.md) - Wrapping OS handles specifically
