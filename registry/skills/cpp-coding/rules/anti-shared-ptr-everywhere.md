# anti-shared-ptr-everywhere

> Don't reach for `shared_ptr` as the default

## Why It Matters

Defaulting to `shared_ptr` for every owned object hides the program's actual ownership structure, adds atomic refcount overhead everywhere (even where nothing is ever actually shared), and risks reference cycles that leak memory silently. `unique_ptr` (or a plain value) should be the default; `shared_ptr` is for the specific, proven case of genuine multi-owner lifetime.

## Bad

```cpp
class Application {
    std::shared_ptr<Renderer> renderer_;   // Only Application ever uses this —
    std::shared_ptr<Config> config_;         // shared_ptr buys nothing here but overhead
public:
    Application()
        : renderer_(std::make_shared<Renderer>()), config_(std::make_shared<Config>()) {}
};
```

## Good

```cpp
class Application {
    std::unique_ptr<Renderer> renderer_;
    Config config_;   // No indirection needed at all
public:
    Application() : renderer_(std::make_unique<Renderer>()), config_() {}
};
```

## See Also

- [own-shared-ptr-not-default](own-shared-ptr-not-default.md) - Full rationale and decision checklist
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - The correct default choice
- [own-weak-ptr-break-cycles](own-weak-ptr-break-cycles.md) - Avoiding cycles when shared ownership is genuinely needed
