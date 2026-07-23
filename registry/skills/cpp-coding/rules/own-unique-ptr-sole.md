# own-unique-ptr-sole

> `unique_ptr` for sole, transferable ownership

## Why It Matters

`unique_ptr<T>` expresses "exactly one owner, transferable" at the type level with zero runtime overhead versus a raw pointer. It cannot be copied, only moved, so the compiler enforces the single-owner invariant. Reach for it first; only introduce `shared_ptr` once you've proven multiple owners genuinely need to keep the object alive.

## Bad

```cpp
Node* build_tree(int depth) {
    Node* n = new Node();
    if (depth > 0) {
        n->left = build_tree(depth - 1);
        n->right = build_tree(depth - 1);
    }
    return n;   // Who owns this? Unclear; easy to leak or double-free.
}
```

## Good

```cpp
struct Node {
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    int value = 0;
};

std::unique_ptr<Node> build_tree(int depth) {
    auto n = std::make_unique<Node>();
    if (depth > 0) {
        n->left = build_tree(depth - 1);
        n->right = build_tree(depth - 1);
    }
    return n;   // Ownership transfers to the caller via move (guaranteed RVO/move)
}
```

## Transferring Into a Container or Function

```cpp
void take_ownership(std::unique_ptr<Widget> w) {
    store(std::move(w));   // Sink parameter: signature makes ownership transfer explicit
}

std::vector<std::unique_ptr<Widget>> widgets;
widgets.push_back(std::make_unique<Widget>());   // Vector now owns it
```

## Converting to `shared_ptr` When Sharing Becomes Necessary

```cpp
std::unique_ptr<Widget> w = std::make_unique<Widget>();
std::shared_ptr<Widget> shared = std::move(w);   // One-way: unique -> shared
// The reverse (shared -> unique) is not possible without re-validating sole ownership.
```

## See Also

- [own-shared-ptr-shared](own-shared-ptr-shared.md) - When to promote to `shared_ptr` instead
- [own-make-unique-shared](own-make-unique-shared.md) - Always construct via `make_unique`
- [raii-unique-ptr-default](raii-unique-ptr-default.md) - RAII rationale for defaulting to `unique_ptr`
