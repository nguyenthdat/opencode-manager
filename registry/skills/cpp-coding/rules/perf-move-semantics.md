# perf-move-semantics

> Use `std::move` to avoid unnecessary copies

## Why It Matters

Move construction/assignment transfers ownership of a resource (typically a heap allocation) by copying a few pointers/handles, versus a copy constructor which duplicates the entire underlying data. For types with expensive-to-copy state (strings, vectors, any RAII resource holder), using `std::move` at the last point an object is needed by value avoids a full, unnecessary duplication.

## Bad

```cpp
void process(std::vector<std::string> items) {
    storage_.push_back(items);   // Copies the entire vector, even though `items`
}                                  // (a by-value parameter) is never used again

std::string build_report() {
    std::string report = generate_content();
    reports_.push_back(report);   // Copies `report` needlessly before it goes out of scope
    return report;
}
```

## Good

```cpp
void process(std::vector<std::string> items) {
    storage_.push_back(std::move(items));   // Moves instead of copying
}

std::string build_report() {
    std::string report = generate_content();
    reports_.push_back(report);              // Still need report afterward, so this copy
    return report;                            // is intentional (NRVO applies to the return)
}

std::string build_report_v2() {
    std::string report = generate_content();
    reports_.push_back(std::move(report));    // Moved: no longer needed after this line
    return {};                                  // (would need restructuring if the
}                                                 // return value was also required)
```

## Don't Move Things Still Needed Afterward

```cpp
void bad_reuse(std::string name) {
    log(std::move(name));   // Moved away...
    log(name);               // ...then used again — logic bug, reads moved-from state
}
```

## See Also

- [own-move-transfer](own-move-transfer.md) - Ownership-transfer semantics of `std::move` in depth
- [mem-use-after-move](mem-use-after-move.md) - The hazard of using an object after moving from it
- [perf-emplace-over-push](perf-emplace-over-push.md) - Constructing in place instead of moving a temporary
