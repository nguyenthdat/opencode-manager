# api-explicit-constructors

> Mark single-argument constructors `explicit`

## Why It Matters

A non-`explicit` single-argument constructor defines an implicit conversion from that argument type to the class — the compiler will silently insert it anywhere the class type is expected, often producing surprising, unintended conversions at call sites that look like ordinary function calls.

## Bad

```cpp
class Seconds {
public:
    Seconds(int value) : value_(value) {}   // Implicit conversion from int!
private:
    int value_;
};

void sleep_for(Seconds duration);

sleep_for(5);       // Silently converts 5 (an int, meaning... what unit?) to Seconds
sleep_for(minutes); // If minutes is an int meant to represent MINUTES, this compiles
                     // and silently misinterprets it as Seconds — a unit bug with no warning.
```

## Good

```cpp
class Seconds {
public:
    explicit Seconds(int value) : value_(value) {}
private:
    int value_;
};

void sleep_for(Seconds duration);

sleep_for(5);              // Compile error: no implicit int -> Seconds conversion
sleep_for(Seconds(5));     // Explicit, unambiguous, forces the caller to state the unit
```

## When Implicit Conversion Is Actually Desired

```cpp
// A deliberate, safe implicit conversion (e.g. widening a std::string_view
// from a std::string) can be left non-explicit — this is a rare, considered
// exception, not the default:
class StringWrapper {
public:
    StringWrapper(const std::string& s) : view_(s) {}  // Deliberately implicit:
                                                         // no unit/precision loss
private:
    std::string_view view_;
};
```

## `explicit` on Multi-Argument Constructors Too (C++11+)

```cpp
class Point {
public:
    explicit Point(double x, double y) : x_(x), y_(y) {}
    // Prevents accidental Point p = {1.0, 2.0}; via copy-list-initialization
    // when that wasn't the intent.
};
```

## See Also

- [type-strong-typedef-ids](type-strong-typedef-ids.md) - Strong types that benefit most from `explicit`
- [api-rule-of-zero-value-types](api-rule-of-zero-value-types.md) - Value type design more broadly
- [type-strongly-typed-units](type-strongly-typed-units.md) - Units-of-measure types like the `Seconds` example above
