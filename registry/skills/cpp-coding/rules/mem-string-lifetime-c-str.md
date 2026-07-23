# mem-string-lifetime-c-str

> Don't retain `c_str()`/`data()` past source lifetime

## Why It Matters

`std::string::c_str()`/`.data()` and `std::string_view::data()` return a pointer into the string's internal buffer. That pointer is only valid as long as the source string exists and isn't reallocated (e.g. by further mutation). Storing it beyond that scope, or after the string is modified, produces a dangling pointer.

## Bad

```cpp
const char* get_message() {
    std::string msg = build_message();
    return msg.c_str();   // Dangling: msg is destroyed when the function returns
}

const char* cache_name(std::string name) {
    static const char* cached = name.c_str();   // `name` is a by-value parameter,
    return cached;                                // destroyed at function exit
}

void mutate_then_use(std::string& s) {
    const char* p = s.c_str();
    s += " more data";   // May reallocate: `p` can now be dangling
    std::cout << p;      // Possible use-after-free
}
```

## Good

```cpp
std::string get_message() {
    return build_message();   // Return by value; caller owns the storage
}

std::string cache_name(std::string name) {
    return name;   // Return the owning string itself, not a pointer into it
}

void mutate_then_use(std::string& s) {
    std::string snapshot = s;         // Copy before mutating if you need both
    s += " more data";
    std::cout << snapshot.c_str();    // Safe: independent storage
}
```

## `string_view` Has the Same Hazard

```cpp
std::string_view danger() {
    std::string local = "temp";
    return local;   // Dangling view: `local` is destroyed at return
}
```

## See Also

- [mem-string-view-borrow](mem-string-view-borrow.md) - `string_view` lifetime caveats
- [mem-no-dangling-reference](mem-no-dangling-reference.md) - The general dangling-pointer/reference hazard
- [own-avoid-get-raw-escape](own-avoid-get-raw-escape.md) - The analogous hazard with smart-pointer `.get()`
