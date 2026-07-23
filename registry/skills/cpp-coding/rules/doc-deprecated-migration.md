# doc-deprecated-migration

> Document migration path for `[[deprecated]]` API

## Why It Matters

`[[deprecated]]` alone tells a caller "don't use this anymore," but not what to use instead. Pairing the attribute with a Doxygen `\deprecated` block (and a concrete replacement example) turns a one-line warning into an actionable migration guide, reducing the friction of actually updating call sites.

## Bad

```cpp
[[deprecated]]
std::string format_date(int y, int m, int d);
// Warning fires, but gives the caller no idea what changed or what to call instead.
```

## Good

```cpp
/// \deprecated Use format_date(const Date&) instead. This overload does not
/// validate month/day ranges and will be removed in v3.0.
///
/// Migration:
/// \code
/// // Before:
/// std::string s = format_date(2026, 7, 20);
/// // After:
/// std::string s = format_date(Date{2026, 7, 20});
/// \endcode
[[deprecated("Use format_date(const Date&) instead; removed in v3.0")]]
std::string format_date(int y, int m, int d);

std::string format_date(const Date& date);
```

## Track the Removal Target

```cpp
// Reference a tracked issue/ticket for the removal, and set a concrete
// target version so the deprecation doesn't linger indefinitely:
//   TODO(#1234): remove format_date(int,int,int) in v3.0 (tracked for 2026-Q4)
```

## See Also

- [api-deprecated-attribute](api-deprecated-attribute.md) - The `[[deprecated]]` attribute mechanics
- [doc-brief-detailed-tags](doc-brief-detailed-tags.md) - The `\deprecated` tag among the standard tag set
- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - Enforcing deprecation warnings in CI
