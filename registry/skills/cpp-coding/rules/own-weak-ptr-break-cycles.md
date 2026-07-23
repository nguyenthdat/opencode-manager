# own-weak-ptr-break-cycles

> `weak_ptr` to break `shared_ptr` cycles

## Why It Matters

`shared_ptr` uses reference counting, which cannot collect cycles: if A holds a `shared_ptr` to B and B holds a `shared_ptr` back to A, both objects leak forever even when nothing external references them. `weak_ptr` provides a non-owning reference that doesn't participate in the reference count, breaking the cycle while still allowing safe, checked access via `.lock()`.

## Bad

```cpp
struct Child;

struct Parent {
    std::vector<std::shared_ptr<Child>> children;
};

struct Child {
    std::shared_ptr<Parent> parent;   // Cycle! parent <-> child keep each other alive forever
};

void demo() {
    auto parent = std::make_shared<Parent>();
    auto child = std::make_shared<Child>();
    child->parent = parent;
    parent->children.push_back(child);
}   // Neither Parent nor Child is ever destroyed — leaked
```

## Good

```cpp
struct Child;

struct Parent {
    std::vector<std::shared_ptr<Child>> children;
};

struct Child {
    std::weak_ptr<Parent> parent;   // Non-owning back-reference; breaks the cycle
};

void use_parent(Child& c) {
    if (auto parent = c.parent.lock()) {   // Safe: check the parent still exists
        parent->do_something();
    } else {
        // Parent was already destroyed
    }
}

void demo() {
    auto parent = std::make_shared<Parent>();
    auto child = std::make_shared<Child>();
    child->parent = parent;
    parent->children.push_back(child);
}   // parent destroyed normally when its shared_ptr refcount reaches zero
```

## Observer Pattern With `weak_ptr`

```cpp
class Subject {
public:
    void subscribe(std::weak_ptr<Observer> obs) { observers_.push_back(std::move(obs)); }

    void notify() {
        for (auto it = observers_.begin(); it != observers_.end(); ) {
            if (auto obs = it->lock()) {
                obs->on_event();
                ++it;
            } else {
                it = observers_.erase(it);   // Observer was destroyed; prune it
            }
        }
    }
private:
    std::vector<std::weak_ptr<Observer>> observers_;
};
```

## See Also

- [own-shared-ptr-shared](own-shared-ptr-shared.md) - When shared ownership is genuinely needed
- [own-enable-shared-from-this](own-enable-shared-from-this.md) - Related pattern for self-referencing shared objects
- [anti-shared-ptr-everywhere](anti-shared-ptr-everywhere.md) - Avoiding overuse that creates these cycles in the first place
