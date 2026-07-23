# name-avoid-hungarian

> Avoid Hungarian notation in modern C++

## Why It Matters

Hungarian notation (encoding a variable's type or scope into its name prefix, e.g. `pszName`, `iCount`, `m_bIsValid`) predates modern IDEs and strong type systems; today, the compiler and editor tooltips already tell you a variable's type instantly, and `const`/`auto`/strong types communicate intent more reliably than a prefix that can silently go stale after a refactor.

## Bad

```cpp
class Widget {
public:
    void set_name(const char* pszName) { m_strName = pszName; }
private:
    std::string m_strName;   // "str" prefix, but if this were refactored to
                               // string_view, the prefix becomes actively wrong
    int m_iWidth;
    bool m_bVisible;
    Widget* m_pParent;
};
```

## Good

```cpp
class Widget {
public:
    void set_name(std::string_view name) { name_ = name; }
private:
    std::string name_;
    int width_ = 0;
    bool visible_ = true;
    Widget* parent_ = nullptr;
};
```

## Scope Prefixes That ARE Still Widely Useful

```cpp
// A trailing underscore (or m_ prefix) for private MEMBERS specifically is a
// scope indicator, not a type-encoding one, and remains a common, useful
// convention — see name-member-trailing-underscore. The distinction is:
// encoding SCOPE (member vs. local) is fine; encoding TYPE (str, i, b, p) is not.
```

## See Also

- [name-member-trailing-underscore](name-member-trailing-underscore.md) - The one scope-indicating prefix worth keeping
- [type-auto-when-clear](type-auto-when-clear.md) - Letting `auto` communicate type where a prefix once tried to
- [type-strong-typedef-ids](type-strong-typedef-ids.md) - Encoding meaning in the type system instead of the name
