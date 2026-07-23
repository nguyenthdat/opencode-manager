# lint-include-what-you-use-tool

> Run include-what-you-use to keep includes minimal

## Why It Matters

Manually auditing every file's `#include` list for correctness (does this file actually use what it includes? does it rely on something arriving transitively, which could break if an unrelated header changes?) doesn't scale. The `include-what-you-use` (IWYU) tool analyzes actual symbol usage and reports exactly which includes are unnecessary and which are missing but relied upon transitively.

## Bad

```cpp
// widget.cpp
#include <iostream>      // Not actually used
#include <vector>         // Used
#include <algorithm>      // Not actually used
#include "renderer.hpp"   // Used only because it happens to also include <string>,
                            // which this file actually needs directly

std::string get_name() {   // Relies on <string> arriving transitively via renderer.hpp —
    return "widget";         // breaks silently if renderer.hpp is ever refactored
}
```

## Good — After Running IWYU

```cpp
// widget.cpp
#include <string>    // Added: this file directly uses std::string
#include <vector>     // Kept: genuinely used
#include "renderer.hpp"

std::string get_name() {
    return "widget";
}
// <iostream> and <algorithm> removed: not actually used
```

## Running IWYU

```bash
# Requires a compile_commands.json (CMAKE_EXPORT_COMPILE_COMMANDS=ON)
iwyu_tool.py -p build -- -Xiwyu --error

# Apply suggested fixes automatically (review the diff before committing):
iwyu_tool.py -p build | fix_includes.py
```

## CMake Integration

```cmake
find_program(IWYU_PATH NAMES include-what-you-use iwyu)
if(IWYU_PATH)
  set_property(TARGET mylib PROPERTY CXX_INCLUDE_WHAT_YOU_USE ${IWYU_PATH})
endif()
```

## See Also

- [proj-minimal-includes](proj-minimal-includes.md) - The manual discipline IWYU automates
- [proj-avoid-circular-includes](proj-avoid-circular-includes.md) - A related header-hygiene concern
- [proj-header-source-split](proj-header-source-split.md) - Reducing what needs to be included at all
