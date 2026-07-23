# anti-using-namespace-std-header

> Don't put `using namespace std;` in headers

## Why It Matters

`using namespace std;` in a header pollutes the global namespace of every translation unit that (directly or transitively) includes it — an identifier a consumer defines that happens to collide with anything in `std::` becomes ambiguous or silently resolves to the wrong symbol, and there is no way for a consumer to opt out short of not including the header.

## Bad

```cpp
// utils.hpp
#pragma once
using namespace std;   // Pollutes every file that includes this header

string format(int value);   // Looks like it's using the global `string`,
                              // but it's really std::string via the using directive
```

## Good

```cpp
// utils.hpp
#pragma once
#include <string>

std::string format(int value);   // Fully qualified: no namespace pollution
```

## `using` Declarations Are Fine, Scoped Locally in a `.cpp` File

```cpp
// utils.cpp
using std::string;   // Scoped to this translation unit only, never in a header
```

## See Also

- [proj-namespace-per-library](proj-namespace-per-library.md) - Namespacing your own library correctly instead
- [name-namespace-lower-snake](name-namespace-lower-snake.md) - Namespace naming conventions
- [proj-header-source-split](proj-header-source-split.md) - Keeping headers minimal and side-effect-free
