# anti-raw-new-delete

> Don't use raw `new`/`delete` for ownership

## Why It Matters

Manual `new`/`delete` pairing requires every code path (including exception paths) to reach the matching `delete` exactly once — miss one path and you leak; hit one twice and you double-free. RAII wrappers (`unique_ptr`/`shared_ptr`) make this entire class of bug structurally impossible.

## Bad

```cpp
Widget* create_and_configure(bool advanced) {
    Widget* w = new Widget();
    if (advanced) {
        configure_advanced(w);   // If this throws, w leaks
    }
    return w;   // Caller must remember to delete — and remember exactly once
}
```

## Good

```cpp
std::unique_ptr<Widget> create_and_configure(bool advanced) {
    auto w = std::make_unique<Widget>();
    if (advanced) {
        configure_advanced(w.get());   // If this throws, w's destructor runs
    }
    return w;
}
```

## See Also

- [raii-no-manual-new-delete](raii-no-manual-new-delete.md) - The full RAII rationale behind this rule
- [own-make-unique-shared](own-make-unique-shared.md) - `make_unique`/`make_shared` as the replacement
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - `unique_ptr` ownership semantics
