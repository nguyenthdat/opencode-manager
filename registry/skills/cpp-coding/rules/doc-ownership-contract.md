# doc-ownership-contract

> Document ownership/lifetime for pointer parameters

## Why It Matters

A raw pointer or reference parameter's type alone doesn't tell a caller whether the function stores it beyond the call (requiring the argument to outlive some other object), or takes ownership in an unusual way. Documenting the lifetime contract explicitly prevents dangling-pointer bugs that the type system can't catch on its own.

## Bad

```cpp
class EventBus {
public:
    void subscribe(Listener* listener);   // Does EventBus store this pointer?
                                            // For how long? Does the caller need
                                            // to keep the Listener alive?
};
```

## Good

```cpp
class EventBus {
public:
    /// Registers a listener to receive future events.
    ///
    /// \param listener Non-owning pointer to the listener. The caller must
    ///        ensure `listener` remains valid until it is unregistered via
    ///        unsubscribe(), or for the lifetime of this EventBus if never
    ///        explicitly unregistered. EventBus does not take ownership.
    void subscribe(Listener* listener);

    /// Unregisters a previously subscribed listener. Safe to call even if
    /// `listener` is not currently subscribed.
    void unsubscribe(Listener* listener);
};
```

## Prefer Encoding the Contract in the Type When Possible

```cpp
// Where feasible, prefer expressing the lifetime contract in the type
// system itself rather than relying purely on documentation:
void subscribe(std::weak_ptr<Listener> listener);   // Ownership/lifetime made explicit
void subscribe(std::shared_ptr<Listener> listener); // by the smart pointer type used
```

## See Also

- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - The convention this documentation reinforces
- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - Related lifetime hazards with callbacks
- [doc-thread-safety-contract](doc-thread-safety-contract.md) - Documenting the analogous concurrency contract
