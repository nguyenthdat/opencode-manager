# anti-naked-new-in-constructor

> Don't leak resources when a constructor throws

## Why It Matters

If a constructor allocates multiple raw resources directly and a later member's initialization throws, any resource already acquired earlier in the initializer list is leaked — the object was never fully constructed, so its destructor never runs, and there is no other cleanup path.

## Bad

```cpp
class Widget {
public:
    Widget() : a_(new A()), b_(new B()) {}   // If `new B()` throws, `a_` leaks:
                                                // Widget's destructor never runs
                                                // for a partially-constructed object.
    ~Widget() { delete a_; delete b_; }
private:
    A* a_;
    B* b_;
};
```

## Good

```cpp
class Widget {
public:
    Widget() : a_(std::make_unique<A>()), b_(std::make_unique<B>()) {}
    // If make_unique<B>() throws, a_'s unique_ptr destructor still runs
    // automatically as part of stack unwinding through the constructor.
private:
    std::unique_ptr<A> a_;
    std::unique_ptr<B> b_;
};
```

## See Also

- [raii-no-manual-new-delete](raii-no-manual-new-delete.md) - The general rule this failure mode motivates
- [err-strong-exception-guarantee](err-strong-exception-guarantee.md) - Exception safety guarantees during construction
- [raii-avoid-two-phase-init](raii-avoid-two-phase-init.md) - Fully constructing valid objects in the constructor
