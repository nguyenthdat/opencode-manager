# api-strong-types-over-bool

> Use `enum class` instead of multiple bools

## Why It Matters

A function signature with two or more `bool` parameters is easy to call with arguments in the wrong order — every call site is `foo(true, false)` with no indication of what each `true`/`false` means without checking the declaration. An `enum class` for each option makes every call site self-documenting and eliminates the possibility of an accidental swap.

## Bad

```cpp
void create_window(int width, int height, bool resizable, bool fullscreen, bool visible);

create_window(800, 600, true, false, true);
// What do true, false, true mean here? Impossible to tell without looking
// up the declaration — and if two adjacent bools are swapped, it compiles
// silently with the wrong behavior.
```

## Good

```cpp
enum class Resizable { No, Yes };
enum class Fullscreen { No, Yes };
enum class Visible { No, Yes };

void create_window(int width, int height, Resizable resizable,
                    Fullscreen fullscreen, Visible visible);

create_window(800, 600, Resizable::Yes, Fullscreen::No, Visible::Yes);
// Self-documenting at the call site, and swapping two arguments is now a
// compile error rather than a silent behavior change.
```

## A Single Combined Options Struct Is Often Even Better

```cpp
struct WindowOptions {
    bool resizable = true;
    bool fullscreen = false;
    bool visible = true;
};

void create_window(int width, int height, WindowOptions options = {});

create_window(800, 600, {.fullscreen = true});   // Named fields: unambiguous, and
                                                    // extending with new options
                                                    // doesn't break existing call sites
```

## See Also

- [type-enum-class-over-enum](type-enum-class-over-enum.md) - `enum class` usage in general
- [name-boolean-is-has](name-boolean-is-has.md) - Naming actual boolean state clearly when a bool is appropriate
- [api-default-member-init](api-default-member-init.md) - Default values for options structs
