# type-strongly-typed-units

> Use strongly-typed units instead of raw numerics

## Why It Matters

A bare `double`/`int` representing a duration, distance, or other physical quantity carries no information about its unit — mixing up milliseconds and seconds, or meters and feet, compiles without error and produces a bug that's often only caught by an incorrect real-world outcome. `std::chrono::duration` and custom strongly-typed quantity wrappers make the unit part of the type, and the compiler rejects unit mismatches or requires an explicit conversion.

## Bad

```cpp
void set_timeout(int timeout);   // Milliseconds? Seconds? Undocumented and unenforced.

set_timeout(5);        // Caller assumed seconds...
set_timeout(5000);      // ...another caller assumed milliseconds. Both compile.
```

## Good — `std::chrono` for Time

```cpp
#include <chrono>
using namespace std::chrono_literals;

void set_timeout(std::chrono::milliseconds timeout);

set_timeout(5s);       // Compiler converts seconds to milliseconds automatically
set_timeout(5000ms);    // Explicit, unambiguous, and unit-checked
// set_timeout(5);      // Compile error: bare int isn't a duration at all
```

## Good — Custom Strong Quantity Types for Domain Units

```cpp
class Meters {
public:
    explicit constexpr Meters(double value) : value_(value) {}
    constexpr double value() const { return value_; }
    friend Meters operator+(Meters a, Meters b) { return Meters(a.value_ + b.value_); }
private:
    double value_;
};

class Feet {
public:
    explicit constexpr Feet(double value) : value_(value) {}
    constexpr Meters to_meters() const { return Meters(value_ * 0.3048); }
private:
    double value_;
};

void set_altitude(Meters altitude);
set_altitude(Feet(100).to_meters());   // Explicit, unit-safe conversion required
```

## See Also

- [type-strong-typedef-ids](type-strong-typedef-ids.md) - The general strong-typing principle applied here
- [api-explicit-constructors](api-explicit-constructors.md) - `explicit` constructors preventing accidental unit confusion
- [tmpl-constexpr-function](tmpl-constexpr-function.md) - `constexpr` conversions computed at compile time where possible
