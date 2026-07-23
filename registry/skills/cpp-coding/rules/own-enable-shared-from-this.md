# own-enable-shared-from-this

> Use `enable_shared_from_this` correctly

## Why It Matters

A member function that needs to hand out a `shared_ptr` to `*this` (e.g. to register a callback) cannot safely do `std::shared_ptr<T>(this)` — that creates a second, independent control block, leading to a double-free when both control blocks reach zero. `enable_shared_from_this` lets an object obtain a `shared_ptr` that shares the *existing* control block, but only if the object is already owned by a `shared_ptr`.

## Bad

```cpp
class Worker {
public:
    void register_callback(EventBus& bus) {
        // Creates a NEW control block unrelated to any existing shared_ptr<Worker>!
        bus.subscribe(std::shared_ptr<Worker>(this));
    }
};

auto w = std::make_shared<Worker>();
w->register_callback(bus);
// Now two independent shared_ptr control blocks both think they own `w`.
// When either reaches refcount 0, it deletes the object — the other becomes
// a dangling pointer. Double-free/use-after-free.
```

## Good

```cpp
class Worker : public std::enable_shared_from_this<Worker> {
public:
    void register_callback(EventBus& bus) {
        bus.subscribe(shared_from_this());   // Shares the existing control block
    }
};

auto w = std::make_shared<Worker>();   // Must be shared_ptr-managed already
w->register_callback(bus);             // Safe: single control block
```

## `shared_from_this()` Requires an Existing `shared_ptr`

```cpp
Worker w;                 // Stack-allocated, not shared_ptr-managed
// w.register_callback(bus);   // Throws std::bad_weak_ptr at runtime!

// Also unsafe: calling shared_from_this() during construction, before any
// shared_ptr owns the object yet:
class Bad : public std::enable_shared_from_this<Bad> {
public:
    Bad() { auto self = shared_from_this(); }  // Throws: no shared_ptr owns *this yet
};
```

## See Also

- [own-weak-ptr-break-cycles](own-weak-ptr-break-cycles.md) - Related non-owning back-reference pattern
- [own-make-unique-shared](own-make-unique-shared.md) - Constructing via `make_shared`
- [own-shared-ptr-shared](own-shared-ptr-shared.md) - When shared ownership is the right model
