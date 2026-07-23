# api-consistent-overload-set

> Keep overload sets consistent and unambiguous

## Why It Matters

When a function name is overloaded, every overload should behave consistently with the others in terms of semantics (does it mutate? does it throw the same way?), and the set as a whole should not create ambiguous or surprising overload resolution at common call sites. Inconsistent or ambiguous overload sets create subtle bugs where the "wrong" overload silently gets picked.

## Bad

```cpp
class Logger {
public:
    void log(const std::string& message);     // Logs at default level
    void log(const char* message, int level);  // DIFFERENT parameter order convention
                                                  // than a hypothetical log(level, message)
                                                  // elsewhere in the same codebase
    void log(int level);   // Surprising: what message does this log?
};

logger.log(3);   // Did the caller mean level 3 with no message, or is this a mistake?
```

## Good

```cpp
class Logger {
public:
    void log(std::string_view message) { log(LogLevel::Info, message); }
    void log(LogLevel level, std::string_view message);
    // Consistent parameter order (level, then message) across every overload;
    // no overload accepts a bare int with unclear meaning.
};

logger.log("started");                      // Defaults to Info level
logger.log(LogLevel::Warning, "low memory"); // Explicit level, same order convention
```

## Avoid Ambiguity With Implicit Conversions

```cpp
void process(int value);
void process(double value);

process(5);      // Fine: exact match for int
process(5.0);    // Fine: exact match for double
// process(5.0f);  // Ambiguous in some contexts if both conversions are equally
                    // viable — avoid overload sets that rely on implicit
                    // conversion ranking to disambiguate.
```

## See Also

- [api-explicit-constructors](api-explicit-constructors.md) - Avoiding implicit-conversion surprises
- [name-functions-lower-snake](name-functions-lower-snake.md) - Naming conventions across an overload set
- [api-strong-types-over-bool](api-strong-types-over-bool.md) - Reducing ambiguity via stronger parameter types
