# err-strong-exception-guarantee

> Provide at least the basic guarantee; prefer the strong guarantee for critical ops

## Why It Matters

Exception safety is categorized into levels: **no-throw** (never fails), **strong** (operation either fully succeeds or has no visible effect, as if it never ran), **basic** (invariants hold, but state may have partially changed), and **no guarantee** (anything can happen, including leaks and broken invariants). Every public operation should provide at least the basic guarantee; the strong guarantee is worth the (often small) extra cost for operations where "partially applied" would corrupt meaningful state.

## Bad

```cpp
class Transaction {
public:
    void apply(const std::vector<Operation>& ops) {
        for (const auto& op : ops) {
            state_.apply(op);   // If op #3 of 5 throws, state_ is now
                                  // partially updated — no guarantee at all,
                                  // and no way to know which ops applied.
        }
    }
private:
    State state_;
};
```

## Good — Strong Guarantee via Copy-and-Swap

```cpp
class Transaction {
public:
    void apply(const std::vector<Operation>& ops) {
        State candidate = state_;         // Copy: work on a scratch copy
        for (const auto& op : ops) {
            candidate.apply(op);          // If this throws, `state_` is untouched
        }
        state_ = std::move(candidate);    // Commit: noexcept move, cannot fail
    }
private:
    State state_;
};
```

## Basic Guarantee Is Often Good Enough

```cpp
// Basic guarantee: if push_back's reallocation throws, the vector remains
// valid and usable (just unchanged), even though the operation didn't complete.
// std::vector::push_back already provides this out of the box.
std::vector<HeavyObject> items;
items.push_back(make_heavy_object());   // Either succeeds, or items is unchanged
```

## See Also

- [err-raii-exception-safety](err-raii-exception-safety.md) - RAII as the mechanism enabling these guarantees
- [own-move-transfer](own-move-transfer.md) - `noexcept` move as the final, non-failing commit step
- [err-noexcept-correctness](err-noexcept-correctness.md) - Marking the commit step `noexcept`
