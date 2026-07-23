# tmpl-template-template-param

> Use template template parameters judiciously

## Why It Matters

A template template parameter lets a generic component be parameterized by *which container template* to use (e.g. `std::vector` vs `std::deque`), not just by element type. It's the right tool when you genuinely need to abstract over the container template itself; overusing it for cases where a simple type parameter (holding an already-instantiated container type) would suffice adds unnecessary complexity.

## Bad — Reinventing a Fixed Container Choice as "Generic"

```cpp
// Needlessly abstracts over the container template when only std::vector is
// ever actually passed in practice, at the cost of much harder-to-read code.
template <template <typename, typename...> class Container, typename T>
class Repository {
    Container<T> items_;
};
```

## Good — When You Genuinely Need Container-Template Flexibility

```cpp
template <template <typename, typename> class Container, typename T>
class Stack {
public:
    void push(T value) { data_.push_back(std::move(value)); }
    T pop() {
        T value = std::move(data_.back());
        data_.pop_back();
        return value;
    }
private:
    Container<T, std::allocator<T>> data_;
};

Stack<std::vector, int> vec_stack;
Stack<std::deque, int> deque_stack;   // Genuinely swappable underlying container
```

## Prefer the Simpler Alternative When Possible

```cpp
// If callers only ever supply a fully-instantiated container type, a plain
// type parameter is simpler and just as flexible:
template <typename Container>
class Stack {
public:
    using T = typename Container::value_type;
    void push(T value) { data_.push_back(std::move(value)); }
private:
    Container data_;
};

Stack<std::vector<int>> vec_stack;
Stack<std::deque<int>> deque_stack;
```

## See Also

- [tmpl-variadic-parameter-pack](tmpl-variadic-parameter-pack.md) - Variadic generic code patterns
- [tmpl-avoid-bloat](tmpl-avoid-bloat.md) - Watching for instantiation bloat with heavily generic code
- [type-strong-typedef-ids](type-strong-typedef-ids.md) - Using type aliases to simplify generic signatures
