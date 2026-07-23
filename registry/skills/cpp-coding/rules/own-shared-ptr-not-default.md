# own-shared-ptr-not-default

> Don't default to `shared_ptr` "just in case"

## Why It Matters

Reaching for `shared_ptr` everywhere to sidestep thinking about ownership hides the actual ownership structure of a program, adds atomic refcount overhead on every copy, risks reference cycles, and makes it hard to reason about destruction order. Ownership should be designed deliberately: start with `unique_ptr` or plain values, and only introduce `shared_ptr` where multiple independent owners are a proven requirement.

## Bad

```cpp
class Application {
    std::shared_ptr<Renderer> renderer_;      // Only Application ever uses this
    std::shared_ptr<InputHandler> input_;     // Only Application ever uses this
    std::shared_ptr<Config> config_;          // Only Application ever uses this
public:
    Application()
        : renderer_(std::make_shared<Renderer>()),
          input_(std::make_shared<InputHandler>()),
          config_(std::make_shared<Config>()) {}
};
// Every member here has exactly one owner: Application. shared_ptr buys nothing
// but atomic refcount overhead and obscured ownership.
```

## Good

```cpp
class Application {
    std::unique_ptr<Renderer> renderer_;
    std::unique_ptr<InputHandler> input_;
    Config config_;   // No indirection needed at all if it's not polymorphic
public:
    Application()
        : renderer_(std::make_unique<Renderer>()),
          input_(std::make_unique<InputHandler>()),
          config_() {}
};
```

## Ask This Before Reaching for `shared_ptr`

1. Does more than one independent part of the system need to keep this object alive?
2. Is the object's lifetime genuinely determined by "whoever needs it last," not a single clear owner?
3. Have you ruled out passing a reference/`observer_ptr`/`span` instead?

If the answer to (1) and (2) is no, use `unique_ptr`, a plain value, or a non-owning reference/pointer instead.

## See Also

- [own-shared-ptr-shared](own-shared-ptr-shared.md) - Legitimate uses of `shared_ptr`
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - The default choice
- [anti-shared-ptr-everywhere](anti-shared-ptr-everywhere.md) - Anti-pattern reference
