# proj-avoid-circular-includes

> Avoid circular includes via forward declarations

## Why It Matters

If header A includes header B, and header B includes header A, the include-guard mechanism breaks the cycle at an arbitrary point, leaving one of the two headers processed before the other's declarations exist — resulting in confusing, order-dependent compile errors. Forward declarations (declaring a class without its full definition) break the cycle when only a pointer/reference to the type is needed, not its full definition.

## Bad

```cpp
// user.hpp
#pragma once
#include "account.hpp"   // Needs Account for a member

class User {
public:
    Account* account;
};

// account.hpp
#pragma once
#include "user.hpp"       // Needs User for a member — CIRCULAR!

class Account {
public:
    User* owner;
};
```

## Good — Forward Declaration Breaks the Cycle

```cpp
// user.hpp
#pragma once
class Account;   // Forward declaration: enough for a pointer/reference member

class User {
public:
    Account* account;   // Only needs Account* here, not the full definition
};

// user.cpp
#include "user.hpp"
#include "account.hpp"   // Full definition included where actually used

// account.hpp
#pragma once
class User;   // Forward declaration

class Account {
public:
    User* owner;
};
```

## When the Full Definition Is Genuinely Needed in Both Headers

```cpp
// If both types truly need each other's complete definition inline (rare,
// and often a sign the two classes should be merged, or that one member
// should move to a .cpp-only implementation detail), restructure instead
// of trying to force a circular #include relationship to work.
```

## See Also

- [proj-include-guards-pragma-once](proj-include-guards-pragma-once.md) - The mechanism that surfaces this issue
- [proj-minimal-includes](proj-minimal-includes.md) - Forward declarations as part of minimizing includes generally
- [proj-header-source-split](proj-header-source-split.md) - Where the full include belongs instead
