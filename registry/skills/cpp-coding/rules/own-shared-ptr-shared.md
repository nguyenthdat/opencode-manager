# own-shared-ptr-shared

> `shared_ptr` only for genuine shared ownership

## Why It Matters

`shared_ptr` costs an atomic increment/decrement on every copy/destruction and a heap-allocated control block. It's the right tool when an object's lifetime genuinely depends on multiple independent owners (e.g. a cache entry referenced by several subsystems that don't coordinate destruction order). Using it as a default "safe" choice everywhere hides ownership structure and adds needless overhead.

## Bad

```cpp
class Cache {
public:
    std::shared_ptr<Texture> get(const std::string& key) {
        return textures_[key];   // shared_ptr used even though Cache is the sole owner
    }
private:
    std::unordered_map<std::string, std::shared_ptr<Texture>> textures_;
};

// Every caller now silently extends the texture's lifetime, which may be
// surprising: the cache can no longer evict textures deterministically.
```

## Good

```cpp
class Cache {
public:
    // Cache alone owns the textures; callers get a non-owning view.
    const Texture* get(const std::string& key) const {
        auto it = textures_.find(key);
        return it != textures_.end() ? it->second.get() : nullptr;
    }
private:
    std::unordered_map<std::string, std::unique_ptr<Texture>> textures_;
};
```

## When `shared_ptr` Is the Right Tool

```cpp
// Genuine shared ownership: multiple independent subsystems each need the
// object to outlive their own scope, with no single clear owner.
class EventBus {
public:
    void subscribe(std::shared_ptr<Listener> l) { listeners_.push_back(std::move(l)); }
    void publish(const Event& e) {
        for (auto& l : listeners_) l->on_event(e);   // Listener may be shared
                                                       // with the subscriber's own code
    }
private:
    std::vector<std::shared_ptr<Listener>> listeners_;
};

// Shared graph/tree nodes where multiple parents legitimately reference a child
std::shared_ptr<Node> shared_child = std::make_shared<Node>();
parent_a->children.push_back(shared_child);
parent_b->children.push_back(shared_child);   // Both parents keep it alive
```

## See Also

- [own-unique-ptr-sole](own-unique-ptr-sole.md) - Default choice before reaching for `shared_ptr`
- [own-shared-ptr-not-default](own-shared-ptr-not-default.md) - Anti-pattern of defaulting to `shared_ptr`
- [own-weak-ptr-break-cycles](own-weak-ptr-break-cycles.md) - Avoiding reference cycles between shared owners
